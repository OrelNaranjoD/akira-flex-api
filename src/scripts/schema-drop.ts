import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { config } from 'dotenv';

config();

/**
 * Script to drop all schemas, tables, and functions from the database.
 * This is useful for starting fresh with a clean database state.
 */
async function dropAllSchemasAndTables() {
  console.log('Starting database schema drop...');

  const envSchema = Joi.object({
    DATABASE_URL: Joi.string().uri().required(),
    DATABASE_TEST_URL: Joi.string().uri().optional(),
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test', 'provision')
      .default('development'),
  });

  const envValidation = envSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: true,
  });

  if (envValidation.error) {
    console.error('Environment validation failed:', envValidation.error.details);
    console.log('');
    console.log('Make sure you have a .env file with the required environment variables:');
    console.log('   DATABASE_URL=postgresql://user:password@localhost:5432/database');
    console.log('   DATABASE_TEST_URL=postgresql://user:password@localhost:5432/database_test');
    process.exit(1);
  }

  const configService = new ConfigService();
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isTest = nodeEnv === 'test';
  const databaseUrl = isTest
    ? configService.get<string>('DATABASE_TEST_URL') || configService.get<string>('DATABASE_URL')
    : configService.get<string>('DATABASE_URL');

  if (nodeEnv === 'production') {
    console.error('Cannot run schema drop in production environment!');
    process.exit(1);
  }

  console.log(`Environment: ${nodeEnv}`);
  console.log(`Database URL: ${databaseUrl?.replace(/:\/\/.*@/, '://***:***@')}`);

  const tempDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    synchronize: false,
    dropSchema: false,
    logging: false,
  });

  try {
    console.log('Connecting to database...');
    await tempDataSource.initialize();
    console.log('Connected successfully');

    console.log('Fetching all schemas...');
    const schemas = await tempDataSource.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);

    console.log(`Found ${schemas.length} schemas:`);
    schemas.forEach((schema: any) => console.log(`  - ${schema.schema_name}`));

    console.log('Fetching tenant schema names from database...');
    const tenantRecords = await tempDataSource.query(`
      SELECT schema_name
      FROM tenants
      WHERE schema_name IS NOT NULL AND schema_name != ''
      ORDER BY schema_name
    `);

    console.log(`Found ${tenantRecords.length} tenant records:`);
    tenantRecords.forEach((tenant: any) => console.log(`  - ${tenant.schema_name}`));

    const tenantSchemas = schemas.filter((schema: any) =>
      tenantRecords.some((tenant: any) => tenant.schema_name === schema.schema_name)
    );

    if (tenantSchemas.length > 0) {
      console.log(`Dropping ${tenantSchemas.length} tenant schemas...`);
      for (const schema of tenantSchemas) {
        console.log(`Dropping schema: ${schema.schema_name}`);
        await tempDataSource.query(`DROP SCHEMA "${schema.schema_name}" CASCADE`);
      }
      console.log('Tenant schemas dropped');
    } else {
      console.log('No tenant schemas found');
    }

    console.log('Fetching tables in public schema...');
    const tables = await tempDataSource.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`Found ${tables.length} tables in public schema:`);
    tables.forEach((table: any) => console.log(`${table.tablename}`));

    if (tables.length > 0) {
      console.log('Dropping all tables in public schema...');

      await tempDataSource.query('SET session_replication_role = replica');

      for (const table of tables) {
        console.log(`Dropping table: ${table.tablename}`);
        await tempDataSource.query(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`);
      }

      await tempDataSource.query('SET session_replication_role = origin');

      console.log('Public tables dropped');
    } else {
      console.log('No tables found in public schema');
    }

    console.log('Fetching functions...');
    const functions = await tempDataSource.query(`
      SELECT
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY n.nspname, p.proname
    `);

    console.log(`Found ${functions.length} functions:`);
    functions.forEach((func: any) =>
      console.log(`${func.schema_name}.${func.function_name}(${func.arguments})`)
    );

    if (functions.length > 0) {
      console.log('Dropping all functions...');

      console.log('Dropping extensions that contain functions...');
      const extensionsToDrop = ['uuid-ossp'];
      for (const ext of extensionsToDrop) {
        try {
          await tempDataSource.query(`DROP EXTENSION IF EXISTS "${ext}" CASCADE`);
          console.log(`Extension ${ext} dropped`);
        } catch (error) {
          console.warn(`Could not drop extension ${ext}:`, error.message);
        }
      }

      for (const func of functions) {
        try {
          console.log(
            `Dropping function: ${func.schema_name}.${func.function_name}(${func.arguments})`
          );
          await tempDataSource.query(
            `DROP FUNCTION IF EXISTS "${func.schema_name}"."${func.function_name}"(${func.arguments}) CASCADE`
          );
        } catch (error) {
          console.warn(
            `Could not drop function ${func.schema_name}.${func.function_name}:`,
            error.message
          );
        }
      }
      console.log('Functions dropped');
    } else {
      console.log('No functions found');
    }

    console.log('Fetching custom data types...');
    const customTypes = await tempDataSource.query(`
      SELECT
        n.nspname as schema_name,
        t.typname as type_name,
        t.typtype as type_type,
        CASE
          WHEN t.typtype = 'e' THEN 'enum'
          WHEN t.typtype = 'c' THEN 'composite'
          WHEN t.typtype = 'd' THEN 'domain'
          WHEN t.typtype = 'b' THEN 'base'
          ELSE 'other'
        END as type_category
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      LEFT JOIN pg_depend d ON t.oid = d.objid AND d.deptype = 'e'
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND t.typtype IN ('e', 'c', 'd')  -- enum, composite, domain
        AND (d.objid IS NULL OR d.deptype != 'e')  -- exclude extension-dependent types
        AND t.typname NOT LIKE '\\\\_%'  -- exclude internal types
      ORDER BY n.nspname, t.typname
    `);

    console.log(`Found ${customTypes.length} custom data types:`);
    customTypes.forEach((type: any) =>
      console.log(`  - ${type.schema_name}.${type.type_name} (${type.type_category})`)
    );

    if (customTypes.length > 0) {
      console.log('Dropping all custom data types...');
      for (const type of customTypes) {
        try {
          console.log(
            `  - Dropping type: ${type.schema_name}.${type.type_name} (${type.type_category})`
          );
          await tempDataSource.query(
            `DROP TYPE IF EXISTS "${type.schema_name}"."${type.type_name}" CASCADE`
          );
        } catch (error) {
          console.warn(`Could not drop type ${type.schema_name}.${type.type_name}:`, error.message);
        }
      }
      console.log('Custom data types dropped');
    } else {
      console.log('No custom data types found');
    }

    console.log('Database schema drop completed successfully!');
    console.log(
      'You can now run your application with synchronize=true or run seeders to recreate the schema'
    );
    console.log(
      'Note: This script removes ALL schemas, tables, functions, and extensions completely.'
    );
    console.log('No extensions are recreated - this is a total reset.');
  } catch (error) {
    console.error('Error during schema drop:', error);
    process.exit(1);
  } finally {
    if (tempDataSource.isInitialized) {
      await tempDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

dropAllSchemasAndTables().catch(() => {
  process.exit(1);
});

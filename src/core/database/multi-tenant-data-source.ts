import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { tenantEntities } from './entities';
import { TenantSchemaNotFoundError } from '../error/tenant-schema-not-found.error';

/**
 * Creates the DataSource options for a tenant.
 * This function is now an internal helper.
 * @param schemaName The schema name for the tenant.
 * @param configService The configuration service instance.
 * @returns DataSourceOptions configured for the tenant.
 */
function createMultiTenantDataSourceOptions(
  schemaName: string,
  configService: ConfigService
): DataSourceOptions {
  const url = configService.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL must be defined');
  }
  const logging = configService.get<string>('TYPEORM_LOGGING') === 'true';
  const dropSchema = false;
  const synchronize = false;

  return {
    type: 'postgres',
    url,
    schema: schemaName,
    entities: tenantEntities,
    autoLoadEntities: true,
    synchronize,
    dropSchema,
    logging,
  } as DataSourceOptions;
}

/**
 * Creates and initializes a DataSource connection for a specific tenant.
 * This is the only function you should export and use from outside.
 * @param schemaName The schema name for the tenant.
 * @param configService The configuration service instance.
 * @returns A promise that resolves to the initialized DataSource.
 * @throws {TenantSchemaNotFoundError} If the tenant schema does not exist.
 * @throws {Error} For any other database error (e.g., credentials).
 */
export async function createMultiTenantDataSource(
  schemaName: string,
  configService: ConfigService
): Promise<DataSource> {
  const options = createMultiTenantDataSourceOptions(schemaName, configService);
  const dataSource = new DataSource(options);
  try {
    return await dataSource.initialize();
  } catch (error) {
    if (error.code === '3F000') {
      await dataSource.destroy();
      throw new TenantSchemaNotFoundError(schemaName);
    }
    throw error;
  }
}

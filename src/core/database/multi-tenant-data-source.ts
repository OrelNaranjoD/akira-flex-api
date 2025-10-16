import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

/**
 * Creates DataSourceOptions for a specific tenant schema.
 * @param schemaName The schema name for the tenant.
 * @param configService The configuration service instance.
 * @returns DataSourceOptions configured for the tenant schema.
 */
export function createMultiTenantDataSourceOptions(
  schemaName: string,
  configService: ConfigService
): DataSourceOptions {
  const url = configService.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL must be defined in environment variables');
  }

  const entitiesPath = join(__dirname, '..', '..', 'modules', 'tenant', '**', '*.entity.{ts,js}');
  const typeormLogging = configService.get<string>('TYPEORM_LOGGING');
  const isLoggerEnabled = typeormLogging === 'true';

  return {
    type: 'postgres',
    url,
    schema: schemaName,
    entities: [entitiesPath],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: isLoggerEnabled,
  };
}

/**
 * Creates and initializes a DataSource for a specific tenant schema.
 * @param schemaName The schema name for the tenant.
 * @param configService The configuration service instance.
 * @returns A promise that resolves to the initialized DataSource.
 */
export async function createMultiTenantDataSource(
  schemaName: string,
  configService: ConfigService
): Promise<DataSource> {
  const options = createMultiTenantDataSourceOptions(schemaName, configService);
  const dataSource = new DataSource(options);
  return await dataSource.initialize();
}

import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantUser } from '../../modules/tenant/auth/users/tenant-user.entity';

/**
 * Factory function to create tenant-specific data sources.
 * @param {string} schemaName - Name of the tenant schema.
 * @param {ConfigService} configService - Configuration service.
 * @returns {DataSourceOptions} Data source configuration.
 */
export function createMultiTenantDataSourceOptions(
  schemaName: string,
  configService: ConfigService
): DataSourceOptions {
  const url = configService.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL must be defined in environment variables');
  }
  return {
    type: 'postgres',
    url,
    schema: schemaName,
    entities: [TenantUser],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') !== 'production',
  };
}

/**
 * Multi-tenant data source factory.
 * @param {string} schemaName - Name of the tenant schema.
 * @param {ConfigService} configService - Configuration service.
 * @returns {Promise<DataSource>} Tenant data source.
 */
export async function createMultiTenantDataSource(
  schemaName: string,
  configService: ConfigService
): Promise<DataSource> {
  const options = createMultiTenantDataSourceOptions(schemaName, configService);
  const dataSource = new DataSource(options);
  return await dataSource.initialize();
}

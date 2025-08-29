import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createMultiTenantDataSource } from '../../../../core/database/multi-tenant-data-source';

/**
 * Service for managing tenant database connections.
 * @class TenantConnectionService
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly tenantDataSources: Map<string, DataSource> = new Map();

  /**
   * Creates an instance of TenantConnectionService.
   * @param {ConfigService} configService - Configuration service.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Gets or creates a data source for a specific tenant.
   * @param {string} schemaName - Name of the tenant schema.
   * @returns {Promise<DataSource>} Tenant data source.
   */
  async getTenantDataSource(schemaName: string): Promise<DataSource> {
    if (this.tenantDataSources.has(schemaName)) {
      return this.tenantDataSources.get(schemaName)!;
    }

    const dataSource = await createMultiTenantDataSource(schemaName, this.configService);
    this.tenantDataSources.set(schemaName, dataSource);
    return dataSource;
  }

  /**
   * Gets the repository for a specific tenant.
   * @param {string} schemaName - Name of the tenant schema.
   * @param {Function} entity - Entity class.
   * @returns {Promise<Repository<any>>} Entity repository.
   */
  async getRepository<T>(schemaName: string, entity: new () => T) {
    const dataSource = await this.getTenantDataSource(schemaName);
    return dataSource.getRepository(entity);
  }

  /**
   * Cleans up connections on module destruction.
   */
  async onModuleDestroy() {
    for (const [schemaName, dataSource] of this.tenantDataSources.entries()) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      this.tenantDataSources.delete(schemaName);
    }
  }
}

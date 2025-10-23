import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { createMultiTenantDataSource } from '../../../../core/database/multi-tenant-data-source';

/**
 * Service for managing tenant database connections.
 * @class TenantConnectionService
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly tenantDataSources: Map<string, DataSource> = new Map();

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
    await dataSource.query(`SET search_path TO "${schemaName}"`);

    this.tenantDataSources.set(schemaName, dataSource);
    return dataSource;
  }

  /**
   * Gets the repository for a specific tenant.
   * @param {string} schemaName - Name of the tenant schema.
   * @param {EntityTarget<T>} entity - Entity class, schema, or name.
   * @returns {Promise<Repository<any>>} Entity repository.
   */
  async getRepository<T extends ObjectLiteral>(
    schemaName: string,
    entity: EntityTarget<T>
  ): Promise<Repository<T>> {
    const dataSource = await this.getTenantDataSource(schemaName);
    const repository = dataSource.getRepository(entity);
    return repository;
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

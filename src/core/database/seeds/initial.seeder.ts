import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { tenantEntities } from '../entities';
import { PlatformPermissionsSeeder } from './platform/platform-permissions.seeder';
import { PlatformRolesSeeder } from './platform/platform-roles.seeder';
import { PlatformUsersSeeder } from './platform/platform-users.seeder';
import { BusinessRolesSeeder } from './platform/business-roles.seeder';
import { TenantPermissionsSeeder } from './tenant/tenant-permissions.seeder';
import { AkiraFlexTenantSeeder } from './tenant/akiraflex-tenant.seeder';
import { RepUSATenantSeeder } from './tenant/repusa-tenant.seeder';
import { MaestranzasUnidosTenantSeeder } from './tenant/maestranzas-unidos-tenant.seeder';

/**
 * Main seeder that orchestrates all database seeding operations.
 * This seeder maintains separation of concerns by delegating to specialized seeders.
 */
@Injectable()
export class InitialSeeder {
  private readonly logger = new Logger(InitialSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly platformPermissionsSeeder: PlatformPermissionsSeeder,
    private readonly platformRolesSeeder: PlatformRolesSeeder,
    private readonly platformUsersSeeder: PlatformUsersSeeder,
    private readonly businessRolesSeeder: BusinessRolesSeeder,
    private readonly tenantPermissionsSeeder: TenantPermissionsSeeder,
    private readonly akiraFlexTenantSeeder: AkiraFlexTenantSeeder,
    private readonly repUSATenantSeeder: RepUSATenantSeeder,
    private readonly maestranzasUnidosTenantSeeder: MaestranzasUnidosTenantSeeder
  ) {}

  /**
   * Runs all seeding operations in the correct order.
   */
  async seed(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      const shouldRecreateTenantSchemas =
        this.configService.get<string>('TYPEORM_DROP_SCHEMA') === 'true' &&
        this.configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true';

      if (shouldRecreateTenantSchemas) {
        await this.recreateTenantSchemas();
      }

      await this.createInitialData();
    }
  }

  /**
   * Orchestrates the creation of all initial data.
   * @private
   */
  private async createInitialData(): Promise<void> {
    await this.platformPermissionsSeeder.seed();
    await this.platformRolesSeeder.seed();
    await this.platformUsersSeeder.seed();
    await this.tenantPermissionsSeeder.seed();
    await this.businessRolesSeeder.seed();
    await this.akiraFlexTenantSeeder.seed();
    await this.repUSATenantSeeder.seed();
    await this.maestranzasUnidosTenantSeeder.seed();
  }

  /**
   * Recreates tenant schemas when drop and sync are enabled.
   * This ensures tenant data is reset during development.
   * @private
   */
  private async recreateTenantSchemas(): Promise<void> {
    const tenantSchemas = ['akiraflex', 'repusa', 'maestranzas-unidos'];

    const tempDataSource = new DataSource({
      type: 'postgres',
      url: this.configService.get<string>('DATABASE_URL'),
      synchronize: false,
      logging: false,
    });

    await tempDataSource.initialize();

    try {
      for (const schemaName of tenantSchemas) {
        await tempDataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        await tempDataSource.query(`CREATE SCHEMA "${schemaName}"`);
        await tempDataSource.query(`SET search_path TO "${schemaName}"`);
        const schemaDataSource = new DataSource({
          type: 'postgres',
          url: this.configService.get<string>('DATABASE_URL'),
          schema: schemaName,
          entities: tenantEntities,
          synchronize: true,
          logging: false,
        });

        await schemaDataSource.initialize();
        await schemaDataSource.destroy();
      }
    } finally {
      await tempDataSource.destroy();
    }
  }
}

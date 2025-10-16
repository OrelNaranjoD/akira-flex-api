import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformPermissionsSeeder } from './platform/platform-permissions.seeder';
import { PlatformRolesSeeder } from './platform/platform-roles.seeder';
import { PlatformUsersSeeder } from './platform/platform-users.seeder';
import { BusinessRolesSeeder } from './platform/business-roles.seeder';
import { TenantPermissionsSeeder } from './tenant/tenant-permissions.seeder';
import { AkiraFlexTenantSeeder } from './tenant/akiraflex-tenant.seeder';
import { TestCorpTenantSeeder } from './tenant/testcorp-tenant.seeder';
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
    private readonly testCorpTenantSeeder: TestCorpTenantSeeder,
    private readonly maestranzasUnidosTenantSeeder: MaestranzasUnidosTenantSeeder
  ) {}

  /**
   * Runs all seeding operations in the correct order.
   */
  async seed(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await this.createInitialData();
    } else {
      await this.createInitialData();
    }
  }

  /**
   * Orchestrates the creation of all initial data.
   * @private
   */
  private async createInitialData(): Promise<void> {
    try {
      this.logger.log('Starting initial database seeding...');
      await this.platformPermissionsSeeder.seed();
      await this.platformRolesSeeder.seed();
      await this.platformUsersSeeder.seed();
      await this.tenantPermissionsSeeder.seed();
      await this.businessRolesSeeder.seed();
      await this.akiraFlexTenantSeeder.seed();
      await this.testCorpTenantSeeder.seed();
      await this.maestranzasUnidosTenantSeeder.seed();
      this.logger.log('Initial database seeding completed successfully.');
    } catch (error) {
      this.logger.error('Failed to complete initial seeding:', error);
      throw error;
    }
  }
}

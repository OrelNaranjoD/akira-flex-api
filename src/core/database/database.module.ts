import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InitialSeeder } from './seeds/initial.seeder';
import { PlatformPermissionsSeeder } from './seeds/platform/platform-permissions.seeder';
import { PlatformRolesSeeder } from './seeds/platform/platform-roles.seeder';
import { PlatformUsersSeeder } from './seeds/platform/platform-users.seeder';
import { BusinessRolesSeeder } from './seeds/platform/business-roles.seeder';
import { TenantPermissionsSeeder } from './seeds/tenant/tenant-permissions.seeder';
import { TenantSeeder } from './seeds/tenant/tenant.seeder';
import { AkiraFlexTenantSeeder } from './seeds/tenant/akiraflex-tenant.seeder';
import { RepUSATenantSeeder } from './seeds/tenant/repusa-tenant.seeder';
import { MaestranzasUnidosTenantSeeder } from './seeds/tenant/maestranzas-unidos-tenant.seeder';
import { TenantConnectionService } from '../../modules/platform/tenants/services/tenant-connection.service';
import { TenantContextService } from '../shared/tenant-context.service';
import { PlatformUsersModule } from '../../modules/platform/auth/platform-users/platform-user.module';
import { PlatformRoleModule } from '../../modules/platform/auth/platform-roles/platform-role.module';

/**
 * Module for database operations and seeding.
 * @module DatabaseModule
 */
@Module({
  imports: [ConfigModule, PlatformUsersModule, PlatformRoleModule],
  providers: [
    InitialSeeder,
    PlatformPermissionsSeeder,
    PlatformRolesSeeder,
    PlatformUsersSeeder,
    BusinessRolesSeeder,
    TenantPermissionsSeeder,
    TenantSeeder,
    AkiraFlexTenantSeeder,
    RepUSATenantSeeder,
    MaestranzasUnidosTenantSeeder,
    TenantConnectionService,
    TenantContextService,
  ],
  exports: [InitialSeeder, TenantConnectionService, TenantContextService],
})
export class DatabaseModule {}

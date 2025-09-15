import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantPermission } from './entities/tenant-permission.entity';
import { TenantPermissionService } from './tenant-permission.service';
import { TenantPermissionController } from './tenant-permission.controller';

/**
 * Module for tenant permissions CRUD and management.
 * @module TenantPermissionModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([TenantPermission])],
  providers: [TenantPermissionService],
  controllers: [TenantPermissionController],
  exports: [TenantPermissionService],
})
export class TenantPermissionModule {}

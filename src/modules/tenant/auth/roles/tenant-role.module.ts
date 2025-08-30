import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantRole } from './entities/tenant-role.entity';
import { TenantRoleService } from './tenant-role.service';
import { TenantRolesController } from './tenant-role.controller';

/**
 * Module for tenant roles and permissions management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TenantRole])],
  providers: [TenantRoleService],
  controllers: [TenantRolesController],
  exports: [TenantRoleService],
})
export class TenantRolesModule {}

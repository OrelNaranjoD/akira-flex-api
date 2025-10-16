import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantUser } from './tenant-user.entity';
import { TenantUserService } from './tenant-user.service';
import { TenantUserController } from './tenant-user.controller';
import { TenantManagementModule } from '../../../../modules/platform/tenants/tenant-management.module';
import { SharedModule } from '../../../../core/shared/shared.module';
import { CreateTenantUserHandler } from './commands/create-tenant-user.handler';

/**
 * Module for user-tenant management functionality.
 * @module TenantUserModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TenantUser]),
    TenantManagementModule,
    SharedModule,
    CqrsModule,
  ],
  controllers: [TenantUserController],
  providers: [TenantUserService, CreateTenantUserHandler],
  exports: [TenantUserService, TypeOrmModule],
})
export class TenantUserModule {}

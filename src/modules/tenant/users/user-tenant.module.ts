import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTenant } from './user-tenant.entity';
import { UserTenantService } from './user-tenant.service';
import { UserTenantController } from './user-tenant.controller';

/**
 * Module for user-tenant management functionality.
 * @module UserTenantModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserTenant])],
  controllers: [UserTenantController],
  providers: [UserTenantService],
  exports: [UserTenantService],
})
export class UserTenantModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantUser } from './tenant-user.entity';
import { TenantUserService } from './tenant-user.service';
import { TenantUserController } from './tenant-user.controller';

/**
 * Module for user-tenant management functionality.
 * @module TenantUserModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([TenantUser])],
  controllers: [TenantUserController],
  providers: [TenantUserService],
  exports: [TenantUserService],
})
export class TenantUserModule {}

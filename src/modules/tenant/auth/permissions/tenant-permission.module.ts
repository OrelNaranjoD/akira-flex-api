import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformPermission } from './entities/tenant-permission.entity';
import { PlatformPermissionService } from './tenant-permission.service';
import { PlatformPermissionController } from './tenant-permission.controller';

/**
 * Module for platform permissions CRUD and management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlatformPermission])],
  providers: [PlatformPermissionService],
  controllers: [PlatformPermissionController],
  exports: [PlatformPermissionService],
})
export class PlatformPermissionModule {}

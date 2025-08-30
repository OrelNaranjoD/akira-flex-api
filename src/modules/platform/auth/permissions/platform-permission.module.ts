import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformPermission } from './entities/platform-permission.entity';
import { PlatformPermissionService } from './platform-permission.service';
import { PlatformPermissionController } from './platform-permission.controller';

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

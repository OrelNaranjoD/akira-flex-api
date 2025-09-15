import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformRole } from '../platform-roles/entities/platform-role.entity';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionGuard } from '../platform-permissions/guards/platform-permission.guard';
import { PlatformUserController } from './platform-user.controller';
import { PlatformUserService } from './platform-user.service';

/**
 * Module for platform user and permissions management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlatformUser, PlatformRole])],
  providers: [PlatformAuthGuard, PlatformPermissionGuard, PlatformUserService],
  controllers: [PlatformUserController],
  exports: [PlatformUserService],
})
export class PlatformUsersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { PlatformUsersModule } from './auth/users/platform-user.module';
import { PlatformRoleModule } from './auth/roles/platform-role.module';
import { PlatformUser } from './auth/users/entities/platform-user.entity';
import { PlatformRole } from './auth/roles/entities/platform-role.entity';
import { PlatformPermission } from './auth/permissions/entities/platform-permission.entity';
import { PlatformPermissionModule } from './auth/permissions/platform-permission.module';

/**
 * Module for platform management. Aggregates auth, users and roles modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformUser, PlatformRole, PlatformPermission]),
    PlatformAuthModule,
    PlatformUsersModule,
    PlatformRoleModule,
    PlatformPermissionModule,
  ],
})
export class PlatformModule {}

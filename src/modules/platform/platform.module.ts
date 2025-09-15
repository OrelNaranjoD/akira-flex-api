import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { PlatformUsersModule } from './auth/platform-users/platform-user.module';
import { PlatformRoleModule } from './auth/platform-roles/platform-role.module';
import { PlatformUser } from './auth/platform-users/entities/platform-user.entity';
import { PlatformRole } from './auth/platform-roles/entities/platform-role.entity';
import { PlatformPermission } from './auth/platform-permissions/entities/platform-permission.entity';
import { PlatformPermissionModule } from './auth/platform-permissions/platform-permission.module';
import { User } from './auth/users/entities/user.entity';
import { Role } from './auth/roles/entities/role.entity';
import { Permission } from './auth/permissions/entities/permission.entity';
import { UserModule } from './auth/users/user.module';
import { RoleModule } from './auth/roles/role.module';
import { PermissionModule } from './auth/permissions/permission.module';

/**
 * Module for platform management. Aggregates auth, users and roles modules.
 * @module PlatformModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformUser,
      PlatformRole,
      PlatformPermission,
      User,
      Role,
      Permission,
    ]),
    PlatformAuthModule,
    PlatformUsersModule,
    PlatformRoleModule,
    PlatformPermissionModule,
    UserModule,
    RoleModule,
    PermissionModule,
  ],
})
export class PlatformModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * Module for  user and permissions management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [PlatformAuthGuard, PermissionGuard, UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}

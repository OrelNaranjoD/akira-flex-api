import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformUser } from './platform-users/entities/platform-user.entity';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformJwtStrategy } from './strategies/platform-jwt.strategy';
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { MailModule } from '../../../core/mail/mail.module';
import { TokenModule } from '../../../core/token/token.module';

/**
 * Module for platform authentication functionality.
 * @module PlatformAuthModule
 */
@Module({
  imports: [MailModule, TypeOrmModule.forFeature([PlatformUser, User, Role]), TokenModule],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService, PlatformJwtStrategy],
  exports: [PlatformAuthService],
})
export class PlatformAuthModule {}

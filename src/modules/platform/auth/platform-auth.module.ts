import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformUser } from './platform-users/entities/platform-user.entity';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformJwtStrategy } from './strategies/platform-jwt.strategy';
import { User } from './users/entities/user.entity';
import { MailModule } from '../../../core/mail/mail.module';

/**
 * Module for platform authentication functionality.
 * @module PlatformAuthModule
 */
@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([PlatformUser, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'platform-secret-key'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService, PlatformJwtStrategy],
  exports: [PlatformAuthService],
})
export class PlatformAuthModule {}

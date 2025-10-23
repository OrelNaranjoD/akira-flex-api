import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenService } from './token.service';
import { JwtKeyManagerService } from './keys/jwt-key-manager.service';
import { JwtKeyRotationService } from './keys/jwt-key-rotation.service';
import { JwtKeyManagementController } from './keys/jwt-key-management.controller';
import { JwtKey } from './keys/jwt-key.entity';

/**
 * Module for token functionality with JWT key rotation support.
 * @module TokenModule
 */
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([JwtKey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_PLATFORM_SECRET', 'platform-secret-key'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [JwtKeyManagementController],
  providers: [TokenService, JwtKeyManagerService, JwtKeyRotationService],
  exports: [TokenService, JwtKeyManagerService, JwtKeyRotationService, JwtModule],
})
export class TokenModule {}

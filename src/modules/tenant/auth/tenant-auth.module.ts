import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantJwtStrategy } from './strategies/tenant-jwt.strategy';
import { TenantAuthService } from './tenant-auth.service';
import { TenantUserModule } from './users/tenant-user.module';
import { TenantModule } from './../tenant.module';
import { TenantManagementModule } from '../../platform/tenants/tenant-management.module';
import { TenantAuthGuard } from './guards/tenant-auth.guard';
import { TenantPermissionGuard } from './tenant-permissions/guards/tenant-permission.guard';
import { TokenModule } from '../../../core/token/token.module';

/**
 * Module for tenant authentication functionality.
 * @module TenantAuthModule
 */
@Module({
  imports: [
    forwardRef(() => TenantModule),
    TenantManagementModule,
    TokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_TENANT_SECRET', 'tenant-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TenantUserModule,
  ],
  controllers: [TenantAuthController],
  providers: [
    TenantAuthService,
    TenantJwtStrategy,
    TenantAuthGuard,
    TenantPermissionGuard,
    {
      provide: APP_GUARD,
      useClass: TenantAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantPermissionGuard,
    },
  ],
  exports: [TenantAuthService],
})
export class TenantAuthModule {}

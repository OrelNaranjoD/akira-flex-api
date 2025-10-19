import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantJwtStrategy } from './strategies/tenant-jwt.strategy';
import { TenantAuthService } from './tenant-auth.service';
import { TenantUserModule } from './users/tenant-user.module';
import { TenantModule } from './../tenant.module';
import { TenantManagementModule } from '../../platform/tenants/tenant-management.module';

/**
 * Module for tenant authentication functionality.
 * @module TenantAuthModule
 */
@Module({
  imports: [
    forwardRef(() => TenantModule),
    TenantManagementModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'tenant-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TenantUserModule,
  ],
  controllers: [TenantAuthController],
  providers: [TenantAuthService, TenantJwtStrategy],
  exports: [TenantAuthService],
})
export class TenantAuthModule {}

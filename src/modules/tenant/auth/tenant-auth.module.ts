import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantJwtStrategy } from './tenant-jwt.strategy';
import { UserTenant } from '../users/user-tenant.entity';
import { Tenant } from '../../platform/tenants/tenant.entity';
import { TenantModule } from '../tenant.module';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import { TenantConnectionService } from '../../platform/tenants/services/tenant-connection.service';
import { TenantAuthService } from './tenant-auth.service';

/**
 * Module for tenant authentication functionality.
 * @module TenantAuthModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, UserTenant]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_TENANT_SECRET', 'tenant-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TenantModule,
  ],
  controllers: [TenantAuthController],
  providers: [TenantService, TenantJwtStrategy, TenantAuthService, TenantConnectionService],
  exports: [TenantService, TenantAuthService],
})
export class TenantAuthModule {}

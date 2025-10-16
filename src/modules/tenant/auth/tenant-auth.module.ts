import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantJwtStrategy } from './strategies/tenant-jwt.strategy';
import { Tenant } from '../../platform/tenants/entities/tenant.entity';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import { TenantConnectionService } from '../../platform/tenants/services/tenant-connection.service';
import { TenantAuthService } from './tenant-auth.service';
import { TenantUser } from './users/tenant-user.entity';
import { TenantUserModule } from './users/tenant-user.module';

/**
 * Module for tenant authentication functionality.
 * @module TenantAuthModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser]),
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
  providers: [TenantService, TenantJwtStrategy, TenantAuthService, TenantConnectionService],
  exports: [TenantService, TenantAuthService],
})
export class TenantAuthModule {}

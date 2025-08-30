import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './services/tenant.service';
import { TenantController } from './tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { TenantConnectionService } from './services/tenant-connection.service';
import { TenantAuthService } from '../../tenant/auth/tenant-auth.service';
import { TenantUser } from '../../tenant/auth/users/tenant-user.entity';

/**
 * Module for tenant management functionality.
 * @module TenantModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser]),
    JwtModule.register({
      secret: 'tenant-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantAuthService, TenantConnectionService],
  exports: [TenantService],
})
export class TenantModule {}

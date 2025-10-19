import { JwtModule } from '@nestjs/jwt';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './services/tenant.service';
import { TenantManagementController } from './tenant-management.controller';
import { Tenant } from './entities/tenant.entity';
import { TenantConnectionService } from './services/tenant-connection.service';
import { TenantUser } from '../../tenant/auth/users/tenant-user.entity';
import { PlatformUsersModule } from '../auth/platform-users/platform-user.module';

/**
 * Module for tenant management functionality.
 * @module TenantManagementModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser]),
    JwtModule.register({
      secret: 'tenant-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    forwardRef(() => PlatformUsersModule),
  ],
  controllers: [TenantManagementController],
  providers: [TenantService, TenantConnectionService],
  exports: [TenantService, TenantConnectionService],
})
export class TenantManagementModule {}

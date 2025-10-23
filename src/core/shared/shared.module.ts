import { Module, forwardRef } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantManagementModule } from '../../modules/platform/tenants/tenant-management.module';
import { AuthController } from './auth.controller';
import { PlatformAuthModule } from '../../modules/platform/auth/platform-auth.module';
import { TenantAuthModule } from '../../modules/tenant/auth/tenant-auth.module';
import { TokenModule } from '../token/token.module';

/**
 * Shared module for common services and utilities.
 */
@Module({
  imports: [
    forwardRef(() => TenantManagementModule),
    forwardRef(() => PlatformAuthModule),
    forwardRef(() => TenantAuthModule),
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class SharedModule {}

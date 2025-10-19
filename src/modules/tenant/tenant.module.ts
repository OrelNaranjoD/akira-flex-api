import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantIdentificationMiddleware } from './auth/middlewares/tenant-identification.middleware';
import { TenantManagementModule } from '../platform/tenants/tenant-management.module';
import { TenantAuthModule } from './auth/tenant-auth.module';
import { TenantUserModule } from './auth/users/tenant-user.module';
import { TenantContextInterceptor } from '../../core/shared/tenant-context.interceptor';
import { SharedModule } from '../../core/shared/shared.module';
import { TenantAuthGuard } from './auth/guards/tenant-auth.guard';
import { TenantPermissionGuard } from './auth/tenant-permissions/guards/tenant-permission.guard';

/**
 * Module for tenant management.
 */
@Module({
  imports: [
    TenantManagementModule,
    forwardRef(() => TenantAuthModule),
    TenantUserModule,
    SharedModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TenantAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantPermissionGuard,
    },
  ],
})
export class TenantModule implements NestModule {
  /**
   * Configures the middleware for tenant identification.
   * @param consumer
   * @description Configures the middleware for tenant identification.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantIdentificationMiddleware)
      .forRoutes(
        'api/v1/auth/tenant/:tenantId/*subpath',
        'api/v1/tenant/:tenantId/*subpath',
        'api/v1/auth/tenant/login',
        'api/v1/tenant/auth/login'
      );
  }
}

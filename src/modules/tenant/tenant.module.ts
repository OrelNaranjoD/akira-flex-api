import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantIdentificationMiddleware } from './auth/middlewares/tenant-identification.middleware';
import { TenantManagementModule } from '../platform/tenants/tenant-management.module';
import { TenantAuthModule } from './auth/tenant-auth.module';
import { TenantUserModule } from './auth/users/tenant-user.module';
import { TenantContextInterceptor } from '../../core/shared/tenant-context.interceptor';
import { SharedModule } from '../../core/shared/shared.module';

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
  ],
})
export class TenantModule implements NestModule {
  /**
   * Configures the middleware for tenant identification.
   * Applies globally but only activates for tenant routes.
   * @param consumer
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantIdentificationMiddleware).forRoutes('/*path');
  }
}

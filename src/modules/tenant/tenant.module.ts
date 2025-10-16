import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantIdentificationMiddleware } from './auth/middlewares/tenant-identification.middleware';
import { TenantModule as PlatformTenantModule } from '../platform/tenants/tenant.module';
import { TenantAuthModule } from './auth/tenant-auth.module';
import { TenantUserModule } from './auth/users/tenant-user.module';

/**
 * Module for tenant management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([]), PlatformTenantModule, TenantAuthModule, TenantUserModule],
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
      .forRoutes('api/v1/auth/tenant/:tenantId/*subpath', 'api/v1/tenant/:tenantId/*subpath');
  }
}

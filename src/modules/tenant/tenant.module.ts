import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantIdentificationMiddleware } from './auth/middlewares/tenant-identification.middleware';
import { TenantModule as PlatformTenantModule } from '../platform/tenants/tenant.module';
import { StatusController } from './status/status.controller';

/**
 * Module for tenant management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([]), PlatformTenantModule],
  controllers: [StatusController],
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
      .forRoutes('auth/tenant/:tenantId/*subpath', 'tenant/:tenantId/*subpath');
  }
}

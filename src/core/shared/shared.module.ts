import { Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

/**
 * Shared module for common services and utilities.
 */
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class SharedModule {}

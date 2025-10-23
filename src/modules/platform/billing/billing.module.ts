import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { TenantManagementModule } from '../tenants/tenant-management.module';

/**
 * Module for billing operations.
 */
@Module({
  imports: [TenantManagementModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

import { Controller, Get, Body, Param, Patch } from '@nestjs/common';
import { BillingService } from './billing.service';
import { RequirePlatformPermission } from '../auth/platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../core/shared/definitions';
import { UpdateTenantDto } from '../tenants/dtos/update-tenant.dto';

/**
 * Controller for billing operations.
 * @class BillingController
 * @description /billing.
 */
@Controller('/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Gets billing information for a tenant.
   * @param tenantId - Tenant ID.
   * @returns Billing info.
   */
  @Get('tenants/:tenantId')
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW)
  async getTenantBilling(@Param('tenantId') tenantId: string) {
    return this.billingService.getTenantBilling(tenantId);
  }

  /**
   * Updates subscription for a tenant.
   * @param tenantId - Tenant ID.
   * @param updateData - Update data.
   * @returns Updated billing info.
   */
  @Patch('tenants/:tenantId/subscription')
  @RequirePlatformPermission(PlatformPermission.TENANT_UPDATE)
  async updateSubscription(
    @Param('tenantId') tenantId: string,
    @Body() updateData: UpdateTenantDto
  ) {
    return this.billingService.updateSubscription(tenantId, updateData);
  }
}

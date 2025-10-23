import { Injectable } from '@nestjs/common';
import { TenantService } from '../tenants/services/tenant.service';
import { UpdateTenantDto } from '../tenants/dtos/update-tenant.dto';

/**
 * Service for billing operations.
 */
@Injectable()
export class BillingService {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Gets billing information for a tenant.
   * @param tenantId - Tenant ID.
   * @returns Billing info.
   */
  async getTenantBilling(tenantId: string) {
    const tenant = await this.tenantService.findOne(tenantId);
    return {
      tenantId,
      subscriptionEnd: tenant.subscriptionEnd,
      maxUsers: tenant.maxUsers,
      modules: tenant.modules,
    };
  }

  /**
   * Updates subscription for a tenant.
   * @param tenantId - Tenant ID.
   * @param updateData - Update data.
   * @returns Updated billing info.
   */
  async updateSubscription(tenantId: string, updateData: UpdateTenantDto) {
    await this.tenantService.update(tenantId, updateData);
    return this.getTenantBilling(tenantId);
  }
}

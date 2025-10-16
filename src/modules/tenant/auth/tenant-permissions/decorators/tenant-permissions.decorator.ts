import { SetMetadata } from '@nestjs/common';
import { TenantPermission } from '@shared';

/**
 * Decorator to define required tenant permissions for a route.
 * @param permissions Array of permission TenantPermission required to access the route.
 * @returns Metadata setter for tenant permissions.
 */
export const RequireTenantPermission = (...permissions: TenantPermission[]) =>
  SetMetadata('permissions', permissions);

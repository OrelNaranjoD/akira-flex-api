import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to define required tenant permissions for a route.
 * @param permissions Array of permission strings required to access the route.
 * @returns Metadata setter for tenant permissions.
 */
export const TenantPermissions = (...permissions: string[]) =>
  SetMetadata('tenantPermissions', permissions);

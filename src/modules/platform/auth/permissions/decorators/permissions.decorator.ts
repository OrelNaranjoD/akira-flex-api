import { SetMetadata } from '@nestjs/common';
//@TODO Fix import to shared lib.
import { Permission } from '@definitions';

/**
 * Decorator to define required  permissions for a route.
 * @param permissions Array of permission Permission required to access the route.
 * @returns Metadata setter for  permissions.
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

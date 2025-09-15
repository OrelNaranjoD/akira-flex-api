import { SetMetadata } from '@nestjs/common';
//@TODO Fix import to shared lib.
import { PlatformPermission } from '@definitions';

/**
 * Decorator to define required platform permissions for a route.
 * @param permissions Array of permission PlatformPermission required to access the route.
 * @returns Metadata setter for platform permissions.
 */
export const RequirePlatformPermission = (...permissions: PlatformPermission[]) =>
  SetMetadata('permissions', permissions);

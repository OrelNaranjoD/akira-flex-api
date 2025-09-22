import { SetMetadata } from '@nestjs/common';
import { PlatformPermission } from '@shared';

/**
 * Decorator to define required platform permissions for a route.
 * @param permissions Array of permission PlatformPermission required to access the route.
 * @returns Metadata setter for platform permissions.
 */
export const RequirePlatformPermission = (...permissions: PlatformPermission[]) =>
  SetMetadata('permissions', permissions);

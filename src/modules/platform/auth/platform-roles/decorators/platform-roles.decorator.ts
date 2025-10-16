import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { PlatformRole } from '@shared';

/**
 * Decorator to set required roles for a platform route.
 * @function PlatformRoles
 * @param {...PlatformRole[]} roles - Required roles.
 * @returns {CustomDecorator<string>}
 */
export const PlatformRoles = (...roles: PlatformRole[]): CustomDecorator<string> =>
  SetMetadata('roles', roles);

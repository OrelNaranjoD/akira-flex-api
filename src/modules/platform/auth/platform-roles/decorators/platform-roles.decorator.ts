import { SetMetadata, CustomDecorator } from '@nestjs/common';
//@TODO fix import path to shared lib.
import { PlatformRole } from '@definitions';

/**
 * Decorator to set required roles for a platform route.
 * @function PlatformRoles
 * @param {...PlatformRole[]} roles - Required roles.
 * @returns {CustomDecorator<string>}
 */
export const PlatformRoles = (...roles: PlatformRole[]): CustomDecorator<string> =>
  SetMetadata('roles', roles);

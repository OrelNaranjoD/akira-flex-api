import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { TenantRole } from '@shared';

/**
 * Decorator to set required roles for a tenant route.
 * @function TenantRoles
 * @param {...TenantRole[]} roles - Required roles.
 * @returns {CustomDecorator<string>}
 */
export const TenantRoles = (...roles: TenantRole[]): CustomDecorator<string> =>
  SetMetadata('roles', roles);

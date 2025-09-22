import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { Role } from '@shared';

/**
 * Decorator to set required roles for a  route.
 * @function Roles
 * @param {...Role[]} roles - Required roles.
 * @returns {CustomDecorator<string>}
 */
export const Roles = (...roles: Role[]): CustomDecorator<string> => SetMetadata('roles', roles);

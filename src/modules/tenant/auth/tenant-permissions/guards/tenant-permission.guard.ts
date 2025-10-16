import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantPermission } from '../../../../../core/shared/definitions';
import { PlatformRole } from '../../../../../core/shared/definitions';

/**
 * Guard for permission-based authorization in tenant context.
 * @class TenantPermissionGuard
 * @implements {CanActivate}
 */
@Injectable()
export class TenantPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determines if the current request is allowed based on tenant permissions.
   * @param {ExecutionContext} context - The execution context.
   * @returns {boolean} - True if the request is allowed, false otherwise.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.get<TenantPermission[]>('permissions', context.getHandler()) || [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRoles: string[] = request.user?.roles || [];
    const userPermissions: TenantPermission[] = request.user?.permissions || [];

    // Allow SUPER_ADMIN to access tenant routes
    if (userRoles.includes(PlatformRole.SUPER_ADMIN)) {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@shared';

/**
 * Guard for permission-based authorization in  context.
 * @class PermissionGuard
 * @implements {CanActivate}
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determine if the current user has the required permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.get<Permission[]>('permissions', context.getHandler()) || [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPermissions: Permission[] = request.user?.permissions || [];

    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}

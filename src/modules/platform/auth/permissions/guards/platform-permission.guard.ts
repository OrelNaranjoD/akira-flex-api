import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformPermission } from '@definitions';

/**
 * Guard for permission-based authorization in platform context.
 * @class PlatformPermissionGuard
 * @implements {CanActivate}
 */
@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determine if the current user has the required permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.get<PlatformPermission[]>('permissions', context.getHandler()) || [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPermissions: PlatformPermission[] = request.user?.permissions || [];

    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}

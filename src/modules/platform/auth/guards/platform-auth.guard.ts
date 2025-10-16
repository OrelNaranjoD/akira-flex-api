import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * Guard for platform authentication.
 * @class PlatformAuthGuard
 * @augments AuthGuard('platform-auth')
 */
@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Overrides canActivate to handle public routes.
   * @param {ExecutionContext} context - Execution context.
   * @returns {boolean | Promise<boolean> | Observable<boolean>} Whether the route can be activated.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}

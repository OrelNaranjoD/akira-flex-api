import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard for platform JWT authentication.
 * @class PlatformJwtAuthGuard
 * @augments AuthGuard('platform-jwt')
 */
@Injectable()
export class PlatformJwtAuthGuard extends AuthGuard('platform-jwt') {
  /**
   * Overrides canActivate to handle public routes.
   * @param {ExecutionContext} context - Execution context.
   * @returns {boolean | Promise<boolean> | Observable<boolean>} Whether the route can be activated.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom logic for public routes if needed
    return super.canActivate(context);
  }
}

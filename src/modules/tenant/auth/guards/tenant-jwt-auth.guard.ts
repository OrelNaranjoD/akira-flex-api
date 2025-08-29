import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard for tenant JWT authentication.
 * @class TenantJwtAuthGuard
 * @augments AuthGuard('tenant-jwt')
 */
@Injectable()
export class TenantJwtAuthGuard extends AuthGuard('tenant-jwt') {
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

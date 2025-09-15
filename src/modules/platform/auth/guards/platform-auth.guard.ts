import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard for platform authentication.
 * @class PlatformAuthGuard
 * @augments AuthGuard('platform-auth')
 */
@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') {
  /**
   * Overrides canActivate to handle public routes.
   * @param {ExecutionContext} context - Execution context.
   * @returns {boolean | Promise<boolean> | Observable<boolean>} Whether the route can be activated.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.isRoutePublic(context);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  /**
   * Checks if the current route is marked as public.
   * @param {ExecutionContext} context - Execution context.
   * @returns {boolean} True if route is public.
   */
  private isRoutePublic(context: ExecutionContext): boolean {
    const reflector = (context as any).reflector || (context as any).container?.getReflector?.();
    const getMetadata = reflector?.get?.bind(reflector) || Reflect.getMetadata;
    const handler = context.getHandler();
    const cls = context.getClass();
    return getMetadata?.('isPublic', handler) || getMetadata?.('isPublic', cls);
  }
}

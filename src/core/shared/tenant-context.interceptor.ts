import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * Interceptor to populate the TenantContextService with tenant information from the request.
 * This should be applied globally or to tenant-scoped routes.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  /**
   * Intercepts the request to set tenant context.
   * @param context The execution context.
   * @param next The call handler.
   * @returns The observable.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { tenantId?: string; schemaName?: string } | undefined;

    if (user && user.tenantId && user.schemaName) {
      this.tenantContextService.setContext(user.tenantId, user.schemaName);
    }

    return next.handle();
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { colorize } from '@shared';

/**
 * Debug interceptor that logs HTTP request details in development mode when enabled.
 */
@Injectable()
export class DebugRequestInterceptor implements NestInterceptor {
  private logger = new Logger('DebugRequest');

  /**
   * Print HTTP request details to console if in development mode and enabled.
   * @param context Execution context of NestJS.
   * @param next Next handler in the chain.
   * @returns Observable of the request result.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isDev = process.env.NODE_ENV === 'development';
    const debugEnabled = process.env.ENABLE_DEBUG_REQUEST_INTERCEPTOR === 'true';
    if (!isDev || !debugEnabled) {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = req;
    const msg = [
      colorize(`[${method}]`, 'cyan'),
      colorize(String(url), 'magenta'),
      colorize('params:', 'yellow'),
      JSON.stringify(params),
      colorize('query:', 'green'),
      JSON.stringify(query),
      colorize('body:', 'blue'),
      JSON.stringify(body),
    ].join(' ');
    this.logger.debug(msg);
    return next.handle().pipe(tap(() => {}));
  }
}

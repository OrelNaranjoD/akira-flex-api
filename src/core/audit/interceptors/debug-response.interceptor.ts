import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { colorize } from '@shared';

/**
 * Debug interceptor that logs HTTP response details in development mode when enabled.
 */
@Injectable()
export class DebugResponseInterceptor implements NestInterceptor {
  private logger = new Logger('DebugResponse');

  /**
   * Print HTTP response details to console if in development mode and enabled.
   * @param context Execution context of NestJS.
   * @param next Next handler in the chain.
   * @returns Observable of the request result.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isDev = process.env.NODE_ENV === 'development';
    const debugEnabled = process.env.ENABLE_DEBUG_RESPONSE_INTERCEPTOR === 'true';
    if (!isDev || !debugEnabled) {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const status = res?.statusCode ?? responseBody?.statusCode ?? '-';
          const msg = [
            colorize(`[${method}]`, 'cyan'),
            colorize(String(url), 'magenta'),
            colorize('status:', 'yellow'),
            status,
            colorize('response:', 'green'),
            JSON.stringify(responseBody),
          ].join(' ');
          this.logger.debug(msg);
        },
        error: (error) => {
          const status = error?.statusCode ?? error?.status ?? res?.statusCode ?? '-';
          const msg = [
            colorize(`[${method}]`, 'cyan'),
            colorize(String(url), 'magenta'),
            colorize('status:', 'red'),
            status,
            colorize('error:', 'red'),
            error?.message || error?.toString(),
          ].join(' ');
          this.logger.error(msg);
        },
      })
    );
  }
}

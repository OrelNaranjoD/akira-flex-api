import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from '../audit.service';
import { JwtPayload } from '@orelnaranjod/flex-shared-lib';

/**
 * Interceptor for automatic audit logging of HTTP requests.
 * @class AuditInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  /**
   * Creates an instance of AuditInterceptor.
   * @param {AuditService} auditService - Audit service for logging.
   */
  constructor(private readonly auditService: AuditService) {}

  /**
   * Intercepts HTTP requests and logs audit information.
   * @param {ExecutionContext} context - Execution context.
   * @param {CallHandler} next - Next call handler.
   * @returns {Observable<any>} Observable of the response.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startTime = Date.now();
    const user = request.user as JwtPayload;

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.logSuccess(request, response, startTime, user, data);
        },
        error: (error) => {
          void this.logError(request, response, startTime, user, error);
        },
      })
    );
  }

  /**
   * Logs successful requests.
   * @param {Request} request - HTTP request.
   * @param {Response} response - HTTP response.
   * @param {number} startTime - Request start time.
   * @param {JwtPayload} user - Authenticated user.
   * @param {any} responseData - Response data.
   * @private
   */
  private async logSuccess(
    request: Request,
    response: Response,
    startTime: number,
    user: JwtPayload,
    responseData: any
  ): Promise<void> {
    const executionTime = Date.now() - startTime;

    await this.auditService.log({
      userId: user?.sub,
      userEmail: user?.email,
      userType: user?.type,
      tenantId: user?.tenantId,
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      controllerName: this.getControllerName(request),
      methodName: this.getHandlerName(request),
      ipAddress: this.getClientIp(request),
      userAgent: request.get('user-agent'),
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
      response: this.sanitizeResponse(responseData),
      executionTime,
    });
  }

  /**
   * Logs failed requests.
   * @param {Request} request - HTTP request.
   * @param {Response} response - HTTP response.
   * @param {number} startTime - Request start time.
   * @param {JwtPayload} user - Authenticated user.
   * @param {Error} error - Error object.
   * @private
   */
  private async logError(
    request: Request,
    response: Response,
    startTime: number,
    user: JwtPayload,
    error: any
  ): Promise<void> {
    const executionTime = Date.now() - startTime;

    await this.auditService.log({
      userId: user?.sub,
      userEmail: user?.email,
      userType: user?.type,
      tenantId: user?.tenantId,
      method: request.method,
      url: request.url,
      statusCode: error.status || response.statusCode || 500,
      controllerName: this.getControllerName(request),
      methodName: this.getHandlerName(request),
      ipAddress: this.getClientIp(request),
      userAgent: request.get('user-agent'),
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
      error: error.message || 'Unknown error',
      executionTime,
    });
  }

  /**
   * Extracts controller name from request.
   * @param {Request} request - HTTP request.
   * @returns {string} Controller name.
   * @private
   */
  private getControllerName(request: Request): string {
    return (request as any).route?.path || 'Unknown';
  }

  /**
   * Extracts handler name from request.
   * @param {Request} request - HTTP request.
   * @returns {string} Handler name.
   * @private
   */
  private getHandlerName(request: Request): string {
    return request.method;
  }

  /**
   * Extracts client IP address from request.
   * @param {Request} request - HTTP request.
   * @returns {string} Client IP address.
   * @private
   */
  private getClientIp(request: Request): string {
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Sanitizes request body by removing sensitive information.
   * @param {any} body - Request body.
   * @returns {any} Sanitized body.
   * @private
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'token',
      'accessToken',
      'refreshToken',
      'creditCard',
      'cvv',
      'ssn',
      'socialSecurityNumber',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes response data by removing sensitive information.
   * @param {any} responseData - Response data.
   * @returns {any} Sanitized response.
   * @private
   */
  private sanitizeResponse(responseData: any): any {
    if (!responseData || typeof responseData !== 'object') {
      return responseData;
    }

    // For token responses, redact the actual token
    if (responseData.accessToken) {
      return {
        ...responseData,
        accessToken: '***REDACTED***',
      };
    }

    return responseData;
  }
}

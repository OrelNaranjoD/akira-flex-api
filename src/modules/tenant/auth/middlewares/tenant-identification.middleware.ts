import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../../platform/tenants/services/tenant.service';

/**
 * Middleware for tenant identification and validation.
 * @class TenantIdentificationMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class TenantIdentificationMiddleware implements NestMiddleware {
  /**
   * Creates an instance of TenantIdentificationMiddleware.
   * @param {TenantService} tenantService - Tenant service.
   */
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Identifies and validates the tenant.
   * @param {Request} request - HTTP request.
   * @param {Response} response - HTTP response.
   * @param {NextFunction} next - Next function.
   */
  async use(request: Request, response: Response, next: NextFunction) {
    // Extract tenant ID from URL params, header, or subdomain
    const tenantId = this.extractTenantId(request);

    if (tenantId) {
      try {
        const tenant = await this.tenantService.findOneInternal(tenantId);

        if (!tenant.active) {
          throw new ForbiddenException('Tenant account is not active');
        }

        // Store tenant information in request for later use
        request['tenant'] = tenant;
        next();
      } catch {
        throw new ForbiddenException('Invalid tenant');
      }
    } else {
      next();
    }
  }

  /**
   * Extracts tenant ID from request.
   * @param {Request} request - HTTP request.
   * @returns {string | null} Tenant ID or null.
   * @private
   */
  private extractTenantId(request: Request): string | null {
    // From URL parameters (e.g., /auth/tenant/:tenantId/register)
    if (request.params.tenantId) {
      return request.params.tenantId; // Keep as string to support UUIDs
    }

    // From header
    if (request.headers['x-tenant-id']) {
      return request.headers['x-tenant-id'] as string;
    }

    // From subdomain (e.g., repusa.akiraflex.com)
    const host = request.get('host');
    const subdomain = host?.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      // We'll need to map subdomain to tenant ID
      return null; // This would require additional logic
    }

    return null;
  }
}

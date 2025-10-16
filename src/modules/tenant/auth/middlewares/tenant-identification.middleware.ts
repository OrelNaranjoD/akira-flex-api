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
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Identifies and validates the tenant.
   * @param {Request} request - HTTP request.
   * @param {Response} response - HTTP response.
   * @param {NextFunction} next - Next function.
   */
  async use(request: Request, response: Response, next: NextFunction) {
    try {
      const tenantId = await this.extractTenantId(request);

      if (tenantId) {
        const tenant = await this.tenantService.findOneInternal(tenantId);

        if (!tenant.active) {
          throw new ForbiddenException('Tenant account is not active');
        }

        request['tenant'] = tenant;
        next();
      } else {
        next();
      }
    } catch {
      throw new ForbiddenException('Invalid tenant');
    }
  }

  /**
   * Extracts tenant ID from request.
   * Supports multiple methods:
   * - URL parameters: /auth/tenant/:tenantId/login
   * - Headers: x-tenant-id
   * - Subdomain: akiraflex.domain.com (production)
   * - Headers for localhost: x-tenant-subdomain
   * - Query params for localhost: ?tenant=akiraflex.
   * @param {Request} request - HTTP request.
   * @returns {Promise<string | null>} Tenant ID or null.
   * @private
   */
  private async extractTenantId(request: Request): Promise<string | null> {
    if (request.params.tenantId) {
      return request.params.tenantId;
    }

    if (request.headers['x-tenant-id']) {
      return request.headers['x-tenant-id'] as string;
    }

    const host = request.get('host');
    if (host) {
      let subdomainToUse: string | null = null;

      if (host.includes('localhost')) {
        if (request.headers['x-tenant-subdomain']) {
          subdomainToUse = request.headers['x-tenant-subdomain'] as string;
        } else if (request.query['tenant']) {
          subdomainToUse = request.query['tenant'] as string;
        }
      } else {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          subdomainToUse = subdomain;
        }
      }

      if (subdomainToUse) {
        try {
          const tenant = await this.tenantService.findBySubdomainInternal(subdomainToUse);
          return tenant.id;
        } catch {
          return null;
        }
      }
    }

    return null;
  }
}

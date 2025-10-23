import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

/**
 * Service to provide tenant context information in a REQUEST-scoped manner.
 * This service centralizes access to tenantId and schemaName, ensuring they are
 * only accessible within a tenant-scoped context.
 */
@Injectable({ scope: Scope.REQUEST, durable: true })
export class TenantContextService {
  private tenantId: string | null = null;
  private schemaName: string | null = null;

  constructor(@Inject(REQUEST) private readonly request: any) {}

  /**
   * Sets the tenant context from the request.
   * This should be called by a TenantContextInterceptor after authentication.
   * @param tenantId The tenant ID.
   * @param schemaName The schema name.
   */
  setContext(tenantId: string, schemaName: string): void {
    this.tenantId = tenantId;
    this.schemaName = schemaName;
  }

  /**
   * Gets the current tenant ID.
   * @returns The tenant ID.
   * @throws Error if not in a tenant context.
   */
  getTenantId(): string {
    if (!this.tenantId) {
      throw new Error('Tenant context not available. Ensure request is within a tenant scope.');
    }
    return this.tenantId;
  }

  /**
   * Gets the current schema name.
   * @returns The schema name.
   * @throws Error if not in a tenant context.
   */
  getSchemaName(): string {
    if (!this.schemaName) {
      throw new Error('Tenant context not available. Ensure request is within a tenant scope.');
    }
    return this.schemaName;
  }
}

import { HostComponentInfo, ContextId, ContextIdFactory, ContextIdStrategy } from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

/**
 * Strategy to aggregate context by tenant for durable providers.
 */
export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  /**
   * Attaches context ID based on tenant.
   * @param contextId The original context ID.
   * @param request The request object.
   * @returns The context ID resolver.
   */
  attach(contextId: ContextId, request: Request) {
    const tenantId = (request.headers['x-tenant-id'] as string) || (request.user as any)?.tenantId;
    if (!tenantId || typeof tenantId !== 'string') {
      return {
        resolve: () => contextId,
        payload: {},
      };
    }

    let tenantSubTreeId: ContextId;
    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId)!;
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    return {
      resolve: (info: HostComponentInfo) => (info.isTreeDurable ? tenantSubTreeId : contextId),
      payload: { tenantId },
    };
  }
}

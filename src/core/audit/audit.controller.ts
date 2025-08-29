import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';
import { UserRoles } from '@orelnaranjod/flex-shared-lib';
import { PlatformJwtAuthGuard } from '../../modules/platform/auth/guards/platform-jwt-auth.guard';
import { Roles } from '../../modules/platform/roles/decorators/roles.decorator';
import { RolesGuard } from '../../modules/platform/roles/guards/roles.guard';

/**
 * Controller for audit log management operations.
 * @class AuditController
 * @description /audit.
 */
@Controller('audit')
@UseGuards(PlatformJwtAuthGuard, RolesGuard)
@Roles(UserRoles.SUPER_ADMIN, UserRoles.AUDITOR)
export class AuditController {
  /**
   * Creates an instance of AuditController.
   * @param {AuditService} auditService - Audit service.
   */
  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves audit logs with pagination and filtering.
   * @param query - Query parameters for filtering and pagination.
   * @param query.page - Page number for pagination.
   * @param query.limit - Number of items per page.
   * @param query.userId - ID of the user.
   * @param query.userType - Type of the user.
   * @param query.tenantId - ID of the tenant.
   * @param query.method - HTTP method used.
   * @param query.statusCode - HTTP status code.
   * @param query.startDate - Start date for filtering.
   * @param query.endDate - End date for filtering.
   * @returns {Promise<{ logs: AuditLog[], total: number, page: number, limit: number }>} Paginated audit logs.
   * @description GET /.
   */
  @Get()
  async getAuditLogs(
    @Query()
    query: {
      page?: number;
      limit?: number;
      userId?: number;
      userType?: string;
      tenantId?: number;
      method?: string;
      statusCode?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      userId,
      userType,
      tenantId,
      method,
      statusCode,
      startDate,
      endDate,
    } = query;

    const filters: any = {};

    if (userId) filters.userId = userId;
    if (userType) filters.userType = userType;
    if (tenantId) filters.tenantId = tenantId;
    if (method) filters.method = method;
    if (statusCode) filters.statusCode = parseInt(statusCode.toString(), 10);
    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }

    const [logs, total] = await this.auditService.findAll(
      parseInt(page.toString(), 10),
      parseInt(limit.toString(), 10),
      filters
    );

    return {
      logs,
      total,
      page: parseInt(page.toString(), 10),
      limit: parseInt(limit.toString(), 10),
    };
  }

  /**
   * Retrieves audit logs for a specific user.
   * @param {string} userId - ID of the user.
   * @param {number} page - Page number.
   * @param {number} limit - Number of items per page.
   * @returns {Promise<{ logs: AuditLog[], total: number, page: number, limit: number }>} Paginated audit logs.
   * @description GET /user/:userId.
   */
  @Get('user/:userId')
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
    const [logs, total] = await this.auditService.findByUser(
      userId,
      parseInt(page.toString(), 10),
      parseInt(limit.toString(), 10)
    );

    return {
      logs,
      total,
      page: parseInt(page.toString(), 10),
      limit: parseInt(limit.toString(), 10),
    };
  }

  /**
   * Retrieves audit logs for a specific tenant.
   * @param {string} tenantId - ID of the tenant.
   * @param {number} page - Page number.
   * @param {number} limit - Number of items per page.
   * @returns {Promise<{ logs: AuditLog[], total: number, page: number, limit: number }>} Paginated audit logs.
   * @description GET /tenant/:tenantId.
   */
  @Get('tenant/:tenantId')
  async getTenantAuditLogs(
    @Param('tenantId') tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
    const [logs, total] = await this.auditService.findByTenant(
      tenantId,
      parseInt(page.toString(), 10),
      parseInt(limit.toString(), 10)
    );

    return {
      logs,
      total,
      page: parseInt(page.toString(), 10),
      limit: parseInt(limit.toString(), 10),
    };
  }
}

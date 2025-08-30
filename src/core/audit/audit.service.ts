import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

/**
 * Service responsible for audit logging operations.
 * @class AuditService
 */
@Injectable()
export class AuditService {
  /**
   * Creates an instance of AuditService.
   * @param {Repository<AuditLog>} auditLogRepository - Repository for audit logs.
   */
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Creates a new audit log entry.
   * @param {Partial<AuditLog>} data - Audit log data.
   * @returns {Promise<AuditLog>} The created audit log entry.
   */
  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Finds audit logs with pagination.
   * @param {number} page - Page number.
   * @param {number} limit - Number of items per page.
   * @param {object} filters - Filter criteria.
   * @returns {Promise<[AuditLog[], number]>} Audit logs and total count.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<[AuditLog[], number]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .orderBy('audit_log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Apply filters
    if (filters.userId) {
      query.andWhere('audit_log.user_id = :userId', { userId: filters.userId });
    }

    if (filters.userType) {
      query.andWhere('audit_log.user_type = :userType', {
        userType: filters.userType,
      });
    }

    if (filters.tenantId) {
      query.andWhere('audit_log.tenant_id = :tenantId', {
        tenantId: filters.tenantId,
      });
    }

    if (filters.method) {
      query.andWhere('audit_log.method = :method', { method: filters.method });
    }

    if (filters.statusCode) {
      query.andWhere('audit_log.status_code = :statusCode', {
        statusCode: filters.statusCode,
      });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('audit_log.created_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.getManyAndCount();
  }

  /**
   * Finds audit logs for a specific user.
   * @param {string} userId - ID of the user.
   * @param {number} page - Page number.
   * @param {number} limit - Number of items per page.
   * @returns {Promise<[AuditLog[], number]>} Audit logs and total count.
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<[AuditLog[], number]> {
    return this.findAll(page, limit, { userId });
  }

  /**
   * Finds audit logs for a specific tenant.
   * @param {string} tenantId - ID of the tenant.
   * @param {number} page - Page number.
   * @param {number} limit - Number of items per page.
   * @returns {Promise<[AuditLog[], number]>} Audit logs and total count.
   */
  async findByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<[AuditLog[], number]> {
    return this.findAll(page, limit, { tenantId });
  }

  /**
   * Cleans up old audit logs.
   * @param {number} days - Number of days to keep.
   * @returns {Promise<void>}
   */
  async cleanupOldLogs(days: number = 180): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();
  }
}

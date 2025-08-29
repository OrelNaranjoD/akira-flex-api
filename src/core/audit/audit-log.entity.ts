import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { AuditLogEntity } from '@orelnaranjod/flex-shared-lib';

/**
 * Represents an audit log entry for tracking system activities.
 * @class AuditLog
 */
@Entity('audit_logs', { schema: 'public' })
export class AuditLog implements AuditLogEntity {
  /**
   * Unique identifier for the audit log entry.
   * @type {number}
   */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /**
   * ID of the user who performed the action.
   * @type {string}
   */
  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Email of the user who performed the action.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'user_email', nullable: true })
  @Index()
  userEmail: string;

  /**
   * Type of user (platform or tenant).
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'user_type', nullable: true })
  userType: string;

  /**
   * ID of the tenant where the action was performed.
   * @type {string}
   */
  @Column({ name: 'tenant_id', nullable: true, type: 'uuid' })
  @Index()
  tenantId: string;

  /**
   * HTTP method of the request.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 10 })
  method: string;

  /**
   * URL of the request.
   * @type {string}
   */
  @Column('text')
  url: string;

  /**
   * HTTP status code of the response.
   * @type {number}
   */
  @Column({ type: 'int' })
  statusCode: number;

  /**
   * Name of the controller that handled the request.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'controller_name' })
  controllerName: string;

  /**
   * Name of the method that handled the request.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'method_name' })
  methodName: string;

  /**
   * IP address of the client.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * User agent of the client.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'user_agent', nullable: true })
  userAgent: string;

  /**
   * Request parameters.
   * @type {object}
   */
  @Column('jsonb', { nullable: true })
  params: object;

  /**
   * Request query parameters.
   * @type {object}
   */
  @Column('jsonb', { nullable: true })
  query: object;

  /**
   * Request body.
   * @type {object}
   */
  @Column('jsonb', { nullable: true })
  body: object;

  /**
   * Response data.
   * @type {object}
   */
  @Column('jsonb', { nullable: true })
  response: object;

  /**
   * Error message if the request failed.
   * @type {string}
   */
  @Column('text', { nullable: true })
  error: string;

  /**
   * Execution time in milliseconds.
   * @type {number}
   */
  @Column('float', { name: 'execution_time' })
  executionTime: number;

  /**
   * Date when the action was performed.
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}

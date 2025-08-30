import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '@orelnaranjod/flex-shared-lib';

/**
 * Represents a tenant (company) in the AkiraFlex platform.
 * @class Tenant
 */
@Entity('tenants', { schema: 'public' })
export class Tenant implements TenantEntity {
  /**
   * Unique identifier for the tenant.
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the tenant (company).
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  /**
   * Unique subdomain identifier for the tenant.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  subdomain: string;

  /**
   * Database schema name for tenant isolation.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 50, unique: true, name: 'schema_name' })
  schemaName: string;

  /**
   * Contact email for the tenant.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100 })
  email: string;

  /**
   * Contact phone number for the tenant.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  /**
   * Status of the tenant account.
   * @type {boolean}
   */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  /**
   * Date when the tenant account was created.
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Date when the tenant account was last updated.
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Date when the tenant subscription expires.
   * @type {Date}
   */
  @Column({ type: 'timestamp', name: 'subscription_end', nullable: true })
  subscriptionEnd: Date;

  /**
   * Maximum number of users allowed for this tenant.
   * @type {number}
   */
  @Column({ type: 'int', name: 'max_users', default: 5 })
  maxUsers: number;

  /**
   * List of activated modules for this tenant.
   * @type {string[]}
   */
  @Column('simple-array', { default: '' })
  modules: string[];
}

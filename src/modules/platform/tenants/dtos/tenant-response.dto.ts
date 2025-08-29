import { Exclude, Expose } from 'class-transformer';
import type { TenantResponseDto as DefTenantResponseDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for tenant response (excludes sensitive data).
 * @class TenantResponseDto
 */
@Exclude()
export class TenantResponseDto implements DefTenantResponseDto {
  /**
   * Unique identifier for the tenant.
   * @type {number}
   */
  @Expose()
  id: string;

  /**
   * Name of the tenant (company).
   * @type {string}
   */
  @Expose()
  name: string;

  /**
   * Unique subdomain identifier.
   * @type {string}
   */
  @Expose()
  subdomain: string;

  /**
   * Contact email address.
   * @type {string}
   */
  @Expose()
  email: string;

  /**
   * Contact phone number.
   * @type {string}
   */
  @Expose()
  phone: string;

  /**
   * Activation status of the tenant.
   * @type {boolean}
   */
  @Expose()
  active: boolean;

  /**
   * Date when the tenant was created.
   * @type {Date}
   */
  @Expose()
  createdAt: Date;

  /**
   * Date when the tenant was last updated.
   * @type {Date}
   */
  @Expose()
  updatedAt: Date;

  /**
   * Date when the subscription ends.
   * @type {Date}
   */
  @Expose()
  subscriptionEnd: Date;

  /**
   * Maximum number of users allowed.
   * @type {number}
   */
  @Expose()
  maxUsers: number;

  /**
   * List of activated modules.
   * @type {string[]}
   */
  @Expose()
  modules: string[];
}

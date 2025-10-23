import { Expose } from 'class-transformer';
//@TODO Fix import to shared lib
import { PlatformUserResponseDto as DefCreatePlatformUserDto } from '@shared';

/**
 * Data Transfer Object for user platform response.
 * @class PlatformUserResponseDto
 */
export class PlatformUserResponseDto implements DefCreatePlatformUserDto {
  /**
   * Unique identifier for the user.
   * @type {string}
   */
  @Expose()
  id: string;

  /**
   * User email address.
   * @type {string}
   */
  @Expose()
  email: string;

  /**
   * User first name.
   * @type {string}
   */
  @Expose()
  firstName: string;

  /**
   * User last name.
   * @type {string}
   */
  @Expose()
  lastName: string;

  /**
   * User phone number.
   * @type {string}
   */
  @Expose()
  phone?: string;

  /**
   * User roles.
   * @type {string[]}
   */
  @Expose()
  roles: string[];

  /**
   * Indicates whether the user is active.
   * @type {boolean}
   */
  @Expose()
  active: boolean;

  /**
   * Date when the user was created.
   * @type {Date}
   */
  @Expose()
  createdAt: Date;

  /**
   * Date when the user was last updated.
   * @type {Date}
   */
  @Expose()
  updatedAt: Date;

  /**
   * Date of last successful login.
   * @type {Date}
   */
  @Expose()
  lastLogin?: Date;

  /**
   * Associated tenant information (if user belongs to a tenant).
   * @type {object}
   */
  @Expose()
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    email: string;
    active: boolean;
  };

  /**
   * Tenants managed by this platform user (for admin users).
   * @type {object[]}
   */
  @Expose()
  managedTenants?: {
    id: string;
    name: string;
    subdomain: string;
    email: string;
    active: boolean;
  }[];
}

/**
 * Data Transfer Object for tenant request information.
 * @class TenantRequestDto
 */
export class TenantRequestDto {
  /**
   * User ID.
   * @type {string}
   */
  id: string;

  /**
   * User email.
   * @type {string}
   */
  email: string;

  /**
   * User first name.
   * @type {string}
   */
  firstName: string;

  /**
   * User last name.
   * @type {string}
   */
  lastName: string;

  /**
   * User phone.
   * @type {string}
   */
  phone?: string;

  /**
   * Requested company name.
   * @type {string}
   */
  requestedCompanyName?: string;

  /**
   * Requested subdomain.
   * @type {string}
   */
  requestedSubdomain?: string;

  /**
   * Request creation date.
   * @type {Date}
   */
  createdAt: Date;
}

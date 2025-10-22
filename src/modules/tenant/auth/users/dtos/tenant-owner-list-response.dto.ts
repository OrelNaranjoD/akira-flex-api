/**
 * Data Transfer Object for paginated tenant owner list response.
 * @class TenantOwnerListResponseDto
 */
export class TenantOwnerListResponseDto {
  /**
   * Array of tenant user DTOs (owners only).
   * @type {any[]}
   */
  owners: any[];

  /**
   * Total number of owners matching the filters.
   * @type {number}
   */
  total: number;

  /**
   * Current page number (1-based).
   * @type {number}
   */
  page: number;

  /**
   * Number of items per page.
   * @type {number}
   */
  limit: number;

  /**
   * Total number of pages.
   * @type {number}
   */
  totalPages: number;
}

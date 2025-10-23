import { TenantResponseDto } from './tenant-response.dto';

/**
 * Data Transfer Object for paginated tenant list response.
 * @class TenantListResponseDto
 */
export class TenantListResponseDto {
  /**
   * Array of tenant response DTOs.
   * @type {TenantResponseDto[]}
   */
  tenants: TenantResponseDto[];

  /**
   * Total number of tenants matching the filters.
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

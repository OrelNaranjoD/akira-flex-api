import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for tenant search filters.
 * @class TenantFiltersDto
 */
export class TenantFiltersDto {
  /**
   * Filter by tenant name (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Filter by subdomain (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  subdomain?: string;

  /**
   * Filter by email (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Filter by active status.
   * @type {boolean}
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  active?: boolean;

  /**
   * Filter by creation date from (ISO date string).
   * @type {string}
   */
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  /**
   * Filter by creation date to (ISO date string).
   * @type {string}
   */
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for tenant owner user search filters.
 * @class TenantOwnerFiltersDto
 */
export class TenantOwnerFiltersDto {
  /**
   * Filter by email (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Filter by first name (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  firstName?: string;

  /**
   * Filter by last name (partial match, case insensitive).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  lastName?: string;

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

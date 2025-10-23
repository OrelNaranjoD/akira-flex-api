import { IsOptional, IsString, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for platform user search filters.
 * @class PlatformUserFiltersDto
 */
export class PlatformUserFiltersDto {
  /**
   * Filter by user email (partial match, case insensitive).
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
   * Filter by phone number (partial match).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Filter by role name (exact match).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  @IsIn(['SUPER_ADMIN', 'AUDITOR', 'USER'], {
    message: 'Role must be one of: SUPER_ADMIN, AUDITOR, USER',
  })
  role?: string;

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

  /**
   * Filter by last login date from (ISO date string).
   * @type {string}
   */
  @IsOptional()
  @IsDateString()
  lastLoginFrom?: string;

  /**
   * Filter by last login date to (ISO date string).
   * @type {string}
   */
  @IsOptional()
  @IsDateString()
  lastLoginTo?: string;
}

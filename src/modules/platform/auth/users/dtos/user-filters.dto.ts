import { IsOptional, IsString, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Status } from '../../../../../core/shared/definitions';

/**
 * Data Transfer Object for user search filters.
 * @class UserFiltersDto
 */
export class UserFiltersDto {
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
   * Filter by user status.
   * @type {Status}
   */
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  /**
   * Filter by role names (array of role names to match).
   * @type {string[]}
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  roles?: string[];

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

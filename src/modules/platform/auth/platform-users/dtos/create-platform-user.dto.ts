import { IsString, IsEmail, IsArray, IsOptional, IsEnum } from 'class-validator';
import { CreatePlatformUserDto as DefCreatePlatformUserDto } from '@shared';
import { TenantRequestStatus } from '../entities/platform-user.entity';

/**
 * Data Transfer Object for creating a user on the platform.
 * @class CreatePlatformUserDto
 */
export class CreatePlatformUserDto implements DefCreatePlatformUserDto {
  /**
   * The email address of the user.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * The password for the user account.
   * @type {string}
   */
  @IsString()
  password: string;

  /**
   * The first name of the user.
   * @type {string}
   */
  @IsString()
  firstName: string;

  /**
   * The last name of the user.
   * @type {string}
   */
  @IsString()
  lastName: string;

  /**
   * The phone number of the user (optional).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * The roles assigned to the user.
   * @type {string[]}
   */
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  /**
   * Status of tenant creation request.
   * @type {TenantRequestStatus}
   */
  @IsOptional()
  @IsEnum(TenantRequestStatus)
  tenantRequestStatus?: TenantRequestStatus;

  /**
   * Requested company name for tenant creation.
   * @type {string}
   */
  @IsOptional()
  @IsString()
  requestedCompanyName?: string;

  /**
   * Requested subdomain for tenant creation.
   * @type {string}
   */
  @IsOptional()
  @IsString()
  requestedSubdomain?: string;
}

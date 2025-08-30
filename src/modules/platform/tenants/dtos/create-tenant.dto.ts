import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsNumber, Min } from 'class-validator';
import { CreateTenantDto as DefCreateTenantDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for creating a new tenant.
 * @class CreateTenantDto
 */
export class CreateTenantDto implements DefCreateTenantDto {
  /**
   * Name of the tenant (company).
   * @type {string}
   */
  @IsString()
  name: string;

  /**
   * Unique subdomain identifier.
   * @type {string}
   */
  @IsString()
  subdomain: string;

  /**
   * Contact email address.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * Contact phone number (optional).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Initial activation status.
   * @type {boolean}
   */
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /**
   * Maximum number of users allowed.
   * @type {number}
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number;

  /**
   * List of modules to activate initially.
   * @type {string[]}
   */
  @IsOptional()
  @IsArray()
  modules?: string[];
}

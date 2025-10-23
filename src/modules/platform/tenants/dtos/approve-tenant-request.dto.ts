import { IsString, IsOptional, IsUUID } from 'class-validator';

/**
 * Data Transfer Object for approving a tenant creation request.
 * @class ApproveTenantRequestDto
 */
export class ApproveTenantRequestDto {
  /**
   * ID of the user whose tenant request is being approved.
   * @type {string}
   */
  @IsUUID()
  userId: string;

  /**
   * Approved company name (optional, uses requested name if not provided).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  companyName?: string;

  /**
   * Approved subdomain (optional, uses requested subdomain if not provided).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  subdomain?: string;
}

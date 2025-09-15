import { IsString, IsOptional } from 'class-validator';

/**
 * DTO to create a tenant permission.
 */
export class CreateTenantPermissionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

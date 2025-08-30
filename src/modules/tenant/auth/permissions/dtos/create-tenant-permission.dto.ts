import { IsString, IsOptional } from 'class-validator';

/**
 * DTO to create a platform permission.
 */
export class CreatePlatformPermissionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

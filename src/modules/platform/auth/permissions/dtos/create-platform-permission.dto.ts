import { IsString, IsOptional } from 'class-validator';
import { CreatePlatformPermissionDto as DefCreatePlatformPermissionDto } from '@definitions';

/**
 * DTO to create a platform permission.
 */
export class CreatePlatformPermissionDto implements DefCreatePlatformPermissionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

import { IsString, IsOptional } from 'class-validator';
import { CreatePermissionDto as DefCreatePermissionDto } from '@definitions';

/**
 * DTO to create a  permission.
 */
export class CreatePermissionDto implements DefCreatePermissionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

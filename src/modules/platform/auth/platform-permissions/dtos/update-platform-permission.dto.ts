import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformPermissionDto } from './create-platform-permission.dto';
import { CreatePlatformPermissionDto as DefCreatePlatformPermissionDto } from '@definitions';

/**
 * DTO to update a platform permission.
 */
export class UpdatePlatformPermissionDto
  extends PartialType(CreatePlatformPermissionDto)
  implements Partial<DefCreatePlatformPermissionDto>
{
  code?: string;
  description?: string;
}

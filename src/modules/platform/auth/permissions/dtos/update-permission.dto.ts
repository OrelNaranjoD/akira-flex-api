import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { CreatePermissionDto as DefCreatePermissionDto } from '@shared';

/**
 * DTO to update a  permission.
 */
export class UpdatePermissionDto
  extends PartialType(CreatePermissionDto)
  implements Partial<DefCreatePermissionDto>
{
  code?: string;
  description?: string;
}

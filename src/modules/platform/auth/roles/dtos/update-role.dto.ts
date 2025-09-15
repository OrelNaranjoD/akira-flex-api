import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { CreateRoleDto as DefCreateRoleDto } from '@definitions';

/**
 * Data Transfer Object for updating an existing  role.
 * Extends CreateRoleDto with optional properties.
 */
export class UpdateRoleDto
  extends PartialType(CreateRoleDto)
  implements Partial<DefCreateRoleDto> {}

import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformRoleDto } from './create-platform-role.dto';
//@TODO Fix import to shared lib.
import { CreatePlatformRoleDto as DefCreatePlatformRoleDto } from '@shared';

/**
 * Data Transfer Object for updating an existing platform role.
 * Extends CreatePlatformRoleDto with optional properties.
 */
export class UpdatePlatformRoleDto
  extends PartialType(CreatePlatformRoleDto)
  implements Partial<DefCreatePlatformRoleDto> {}

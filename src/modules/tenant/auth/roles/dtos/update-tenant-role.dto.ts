import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantRoleDto } from './create-tenant-role.dto';

/**
 * Data Transfer Object for updating an existing tenant role.
 * Extends CreateTenantRoleDto with optional properties.
 */
export class UpdateTenantRoleDto extends PartialType(CreateTenantRoleDto) {}

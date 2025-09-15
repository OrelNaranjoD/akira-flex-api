import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantPermissionDto } from './create-tenant-permission.dto';

/**
 * DTO to update a tenant permission.
 */
export class UpdateTenantPermissionDto extends PartialType(CreateTenantPermissionDto) {}

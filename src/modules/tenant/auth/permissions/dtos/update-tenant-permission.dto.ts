import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformPermissionDto } from './create-tenant-permission.dto';

/**
 * DTO to update a platform permission.
 */
export class UpdatePlatformPermissionDto extends PartialType(CreatePlatformPermissionDto) {}

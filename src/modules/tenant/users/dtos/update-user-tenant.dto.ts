import { PartialType } from '@nestjs/mapped-types';
import { CreateUserTenantDto } from './create-user-tenant.dto';

/**
 * Data Transfer Object for updating an existing user tenant.
 * @class UpdateUserTenantDto
 * @augments PartialType<CreateUserTenantDto>
 */
export class UpdateUserTenantDto extends PartialType(CreateUserTenantDto) {}

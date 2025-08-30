import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantUserDto } from './create-tenant-user.dto';
import { CreateTenantDto as DefCreateTenantUserDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for updating an existing tenant user.
 * @class UpdateTenantUserDto
 * @augments PartialType<CreateTenantUserDto>
 */
export class UpdateTenantUserDto
  extends PartialType(CreateTenantUserDto)
  implements Partial<DefCreateTenantUserDto> {}

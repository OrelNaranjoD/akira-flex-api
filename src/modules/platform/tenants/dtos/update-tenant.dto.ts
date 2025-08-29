import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { CreateTenantDto as DefCreateTenantDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for updating an existing tenant.
 * @class UpdateTenantDto
 * @augments PartialType(CreateTenantDto)
 */
export class UpdateTenantDto
  extends PartialType(CreateTenantDto)
  implements Partial<DefCreateTenantDto> {}

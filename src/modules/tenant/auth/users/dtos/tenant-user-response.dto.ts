import { Expose } from 'class-transformer';
import { TenantUserResponseDto as DefTenantUserResponseDto } from '@shared';

/**
 * Data Transfer Object for tenant user response.
 * @class TenantUserResponseDto
 */
export class TenantUserResponseDto implements DefTenantUserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  phone?: string;

  @Expose()
  roles: string[];

  @Expose()
  active: boolean;

  @Expose()
  tenantId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  lastLogin?: Date;
}

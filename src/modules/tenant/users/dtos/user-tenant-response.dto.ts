import { Expose } from 'class-transformer';

/**
 * Data Transfer Object for tenant user response.
 * @class UserTenantResponseDto
 */
export class UserTenantResponseDto {
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

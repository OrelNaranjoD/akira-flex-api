import { Expose, Type } from 'class-transformer';
import { TenantUserResponseDto } from './tenant-user-response.dto';

/**
 * Data Transfer Object for tenant user list response with pagination.
 * @class TenantUserListResponseDto
 */
export class TenantUserListResponseDto {
  @Expose()
  @Type(() => TenantUserResponseDto)
  users: TenantUserResponseDto[];

  @Expose()
  total?: number;

  @Expose()
  page?: number;

  @Expose()
  limit?: number;

  @Expose()
  totalPages?: number;
}

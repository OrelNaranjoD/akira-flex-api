import { Expose, Type } from 'class-transformer';
import { PlatformUserResponseDto } from './platform-user-response.dto';

/**
 * Data Transfer Object for platform user list response with pagination.
 * @class PlatformUserListResponseDto
 */
export class PlatformUserListResponseDto {
  @Expose()
  @Type(() => PlatformUserResponseDto)
  users: PlatformUserResponseDto[];

  @Expose()
  total?: number;

  @Expose()
  page?: number;

  @Expose()
  limit?: number;

  @Expose()
  totalPages?: number;
}

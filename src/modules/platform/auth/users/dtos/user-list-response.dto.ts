import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

/**
 * Data Transfer Object for user list response with pagination.
 * @class UserListResponseDto
 */
export class UserListResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  users: UserResponseDto[];

  @Expose()
  total?: number;

  @Expose()
  page?: number;

  @Expose()
  limit?: number;

  @Expose()
  totalPages?: number;
}

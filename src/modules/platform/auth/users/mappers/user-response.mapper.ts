import { omit } from 'lodash';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dtos/user-response.dto';

/**
 * Maps a User entity to a UserResponseDto, omitting sensitive fields like password.
 * @param {User} user - The User entity to map.
 * @returns {UserResponseDto} The mapped UserResponseDto.
 */
export function mapUserToResponse(user: User): UserResponseDto {
  const safeUser = omit(user, ['password']);
  return {
    ...safeUser,
    roles: (safeUser.roles || []).map((role: Role) => role.name),
  };
}

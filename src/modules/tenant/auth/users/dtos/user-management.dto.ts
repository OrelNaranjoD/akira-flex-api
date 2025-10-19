import { IsArray, IsString, IsBoolean } from 'class-validator';

/**
 * DTO for updating user roles.
 */
export class UpdateUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

/**
 * DTO for toggling user active status.
 */
export class ToggleUserStatusDto {
  @IsBoolean()
  active: boolean;
}

/**
 * DTO for transferring ownership.
 */
export class TransferOwnershipDto {
  @IsString()
  newOwnerId: string;
}

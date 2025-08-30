import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for creating a new tenant role.
 * Contains the name and permissions for the role.
 * @property name The unique name of the tenant role.
 * @property permissions Array of permission strings assigned to the role.
 */
export class CreateTenantRoleDto {
  /**
   * The unique name of the tenant role.
   */
  @IsString()
  name: string;

  /**
   * Array of permission strings assigned to the role.
   */
  @IsArray()
  @ArrayNotEmpty()
  permissions: string[];
}

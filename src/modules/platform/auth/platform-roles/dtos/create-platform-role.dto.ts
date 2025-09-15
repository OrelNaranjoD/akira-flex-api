import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';
//@TODO Fix import to shared lib.
import { CreatePlatformRoleDto as DefCreatePlatformRoleDto } from '@definitions';

/**
 * Data Transfer Object for creating a new platform role.
 * Contains the name and permissions for the role.
 * @property name The unique name of the platform role.
 * @property permissions Array of permission strings assigned to the role.
 */
export class CreatePlatformRoleDto implements DefCreatePlatformRoleDto {
  /**
   * The unique name of the platform role.
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

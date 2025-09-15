import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';
//@TODO Fix import to shared lib.
import { CreateRoleDto as DefCreateRoleDto } from '@definitions';

/**
 * Data Transfer Object for creating a new  role.
 * Contains the name and permissions for the role.
 * @property name The unique name of the  role.
 * @property permissions Array of permission strings assigned to the role.
 */
export class CreateRoleDto implements DefCreateRoleDto {
  /**
   * The unique name of the  role.
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

import { IsString, IsEmail, IsArray, IsOptional } from 'class-validator';
//@TODO Fix import to shared lib
import { CreatePlatformUserDto as DefCreatePlatformUserDto } from '@shared';

/**
 * Data Transfer Object for creating a user on the platform.
 * @class CreatePlatformUserDto
 */
export class CreatePlatformUserDto implements DefCreatePlatformUserDto {
  /**
   * The email address of the user.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * The password for the user account.
   * @type {string}
   */
  @IsString()
  password: string;

  /**
   * The first name of the user.
   * @type {string}
   */
  @IsString()
  firstName: string;

  /**
   * The last name of the user.
   * @type {string}
   */
  @IsString()
  lastName: string;

  /**
   * The phone number of the user (optional).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * The roles assigned to the user.
   * @type {string[]}
   */
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { RegisterDto as DefRegisterDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for user registration.
 * @class RegisterDto
 */
export class RegisterDto implements DefRegisterDto {
  /**
   * User email address.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * User password.
   * @type {string}
   */
  @IsString()
  @MinLength(6)
  password: string;

  /**
   * User first name.
   * @type {string}
   */
  @IsString()
  firstName: string;

  /**
   * User last name.
   * @type {string}
   */
  @IsString()
  lastName: string;

  /**
   * User phone number (optional).
   * @type {string}
   */
  @IsOptional()
  @IsString()
  phone?: string;
}

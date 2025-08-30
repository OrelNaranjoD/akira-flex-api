import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRequestDto as DefLoginRequestDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for user login.
 * @class LoginDto
 */
export class LoginRequestDto implements DefLoginRequestDto {
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
}

import { IsEmail, IsString } from 'class-validator';
import { RegisterResponseDto as DefRegisterResponseDto } from '@shared';

/**
 * Data Transfer Object for user registration.
 * @class RegisterResponseDto
 */
export class RegisterResponseDto implements DefRegisterResponseDto {
  /**
   * Unique identifier for the user.
   * @type {string}
   */
  @IsString()
  id: string;

  /**
   * User email address.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * Indicates the user's status.
   * @type {string}
   */
  @IsString()
  status: string;

  /**
   * Verification token for email confirmation.
   * @type {string}
   */
  @IsString()
  token: string;
}

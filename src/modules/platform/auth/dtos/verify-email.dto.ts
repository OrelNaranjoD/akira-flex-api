import { IsEmail, IsString, Length } from 'class-validator';

/**
 * Data Transfer Object for email verification.
 * @class VerifyEmailDto
 */
export class VerifyEmailDto {
  /**
   * User email address.
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * Verification code.
   * @type {string}
   */
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}

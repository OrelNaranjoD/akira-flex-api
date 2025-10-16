import { IsEmail } from 'class-validator';

/**
 * Data Transfer Object for resending verification code.
 * @class ResendVerificationDto
 */
export class ResendVerificationDto {
  /**
   * User email address.
   * @type {string}
   */
  @IsEmail()
  email: string;
}

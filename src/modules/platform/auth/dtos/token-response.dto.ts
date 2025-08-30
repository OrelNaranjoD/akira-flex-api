import { Expose } from 'class-transformer';
import { TokenResponseDto as DefTokenResponseDto } from '@orelnaranjod/flex-shared-lib';

/**
 * Data Transfer Object for token response.
 * @class TokenResponseDto
 */
export class TokenResponseDto implements DefTokenResponseDto {
  /**
   * JWT access token.
   * @type {string}
   */
  @Expose()
  accessToken: string;

  /**
   * Token expiration time in seconds.
   * @type {number}
   */
  @Expose()
  expiresIn: number;

  /**
   * Token type.
   * @type {string}
   */
  @Expose()
  tokenType: string = 'Bearer';
}

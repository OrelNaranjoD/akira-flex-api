import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtPayload,
  JwtPayloadType,
  JwtEmailVerificationPayload,
  JwtPasswordResetPayload,
  Status,
  PlatformRole,
} from '@definitions';
import { User } from '../../modules/platform/auth/users/entities/user.entity';
import { PlatformUser } from '../../modules/platform/auth/platform-users/entities/platform-user.entity';
import { TokenResponseDto } from '../../modules/platform/auth/dtos/token-response.dto';

/**
 * Token service for generating and verifying JWT tokens.
 * @class TokenService
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generates a JWT token with custom payload and options.
   * @param payload - The token payload.
   * @param options - Options like expiration, etc.
   * @param options.expiresIn - Token expiration time (e.g., '1h', '600s').
   * @returns {string} - The generated JWT token.
   */
  generateToken(payload: object, options?: { expiresIn?: string | number }): string {
    return this.jwtService.sign(payload, options);
  }

  /**
   * Generates access token for a user.
   * @param user - The user entity (PlatformUser or User).
   * @returns {TokenResponseDto} - The generated access token response.
   * @throws {UnauthorizedException} - If the user is not verified (for User entity).
   */
  generateAccessToken(user: PlatformUser | User): TokenResponseDto {
    const permissions = user.roles
      .flatMap((role) => role.permissions.map((p) => p.code))
      .filter((value, index, self) => self.indexOf(value) === index);
    if ('status' in user && user.status !== Status.ACTIVE) {
      throw new UnauthorizedException('User not verified');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles as PlatformRole[],
      permissions,
      type: JwtPayloadType.PLATFORM,
    };
    const accessToken = this.generateToken(payload, { expiresIn: 3600 });
    return {
      accessToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }

  /**
   * Generates JWT token for email verification.
   * @param user - The user entity.
   * @returns {string} - The generated email verification token.
   * @throws {UnauthorizedException} - If the token is invalid or expired.
   */
  generateEmailVerificationToken(user: User): string {
    const payload: JwtEmailVerificationPayload = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.EMAIL_VERIFICATION,
    };
    return this.generateToken(payload, { expiresIn: '600s' });
  }

  /**
   * Generates JWT token for password reset.
   * @param user - The user entity.
   * @returns {string} - The generated password reset token.
   * @throws {UnauthorizedException} - If the token is invalid or expired.
   */
  generatePasswordResetToken(user: User): string {
    const payload: JwtPasswordResetPayload = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.PASSWORD_RESET,
    };
    return this.generateToken(payload, { expiresIn: '600s' });
  }

  /**
   * Verifies and decodes a JWT token.
   * @template T - The expected payload type.
   * @returns {T} Decoded token payload.
   * @throws {UnauthorizedException} If the token is invalid or expired.
   * @param token - The JWT token to verify.
   */
  verifyToken<T extends object>(token: string): T {
    try {
      return this.jwtService.verify<T>(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

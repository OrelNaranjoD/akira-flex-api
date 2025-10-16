import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  JwtPayload,
  JwtPayloadType,
  JwtEmailVerificationPayload,
  JwtPasswordResetPayload,
  Status,
} from '../shared/definitions';
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
   * Generates a refresh token (JWT) with REFRESH type.
   * Refresh tokens have a fixed expiration of 7 days.
   * @param user - The user entity (PlatformUser or User).
   * @returns {string} - The generated refresh token.
   */
  generateRefreshToken(user: PlatformUser | User): string {
    const payload: { sub: string; email: string; type: JwtPayloadType } = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.REFRESH,
    };
    return this.generateToken(payload, { expiresIn: '7d' });
  }

  /**
   * Hash a token before storing in DB.
   * @param token - The token to hash.
   * @returns {Promise<string>} - The hashed token.
   */
  async hashToken(token: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }

  /**
   * Verify a refresh token signature and return its payload, or throw UnauthorizedException.
   * @param token - The refresh token to verify.
   * @template T - The expected payload type.
   * @returns {T} Decoded token payload.
   * @throws {UnauthorizedException} If the token is invalid or expired.
   */
  verifyRefreshToken<T extends object>(token: string): T {
    try {
      return this.jwtService.verify<T>(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate refresh token and its hashed value to be stored in DB.
   * Returns the plain refresh token and the hash to persist.
   * @param user - The user entity (PlatformUser or User).
   * @returns {Promise<{ refreshToken: string; refreshTokenHash: string }>} An object containing the plain refresh token and its hashed value.
   */
  async generateAndHashRefreshToken(user: PlatformUser | User) {
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = await this.hashToken(refreshToken);
    return { refreshToken, refreshTokenHash };
  }

  /**
   * Compare a provided refresh token with a stored hash.
   * @param token - The plain refresh token to compare.
   * @param hash - The stored hash to compare against.
   * @returns {Promise<boolean>} True if they match.
   */
  async compareRefreshTokenWithHash(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /**
   * Build cookie options for the refresh token cookie.
   * Uses a fixed expiration of 7 days.
   * @returns Cookie options object.
   */
  getRefreshCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
      maxAge: 604800000,
    };
  }

  /**
   * Generates access token for a user.
   * @param user - The user entity (PlatformUser or User).
   * @returns {TokenResponseDto} - The generated access token response.
   * @throws {UnauthorizedException} - If the user is not verified (for User entity).
   */
  generateAccessToken(user: PlatformUser | User): TokenResponseDto {
    let permissions = user.roles
      .flatMap((role) => role.permissions.map((p) => p.code))
      .filter((value, index, self) => self.indexOf(value) === index);
    const userType = 'active' in user ? 'PLATFORM' : 'LANDING';
    console.log('generateAccessToken - user type detection:', {
      hasActive: 'active' in user,
      userType: (user as any).type,
      determinedType: userType,
    });
    if (userType === 'LANDING' && (user as any).status !== Status.ACTIVE) {
      throw new UnauthorizedException('User not verified');
    }
    if (userType === 'LANDING') {
      const readPermissions = [
        'USER_VIEW',
        'USER_VIEW_ALL',
        'USER_ROLE_VIEW_OWN',
        'AUTH_REGISTER',
        'AUTH_LOGIN',
        'ROLE_VIEW',
        'ROLE_VIEW_ALL',
        'PERMISSION_VIEW',
        'PERMISSION_VIEW_ALL',
        'TENANT_VIEW',
        'TENANT_VIEW_ALL',
        'AUDIT_VIEW',
        'AUDIT_VIEW_ALL',
        'AUDIT_TENANT_VIEW',
      ];
      permissions = [...new Set([...permissions, ...readPermissions])];
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
      permissions,
      type: userType === 'PLATFORM' ? JwtPayloadType.PLATFORM : JwtPayloadType.LANDING,
    };
    const accessToken = this.generateToken(payload, { expiresIn: '15m' });
    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  /**
   * Generates JWT token for email verification.
   * 10 minutes expiration.
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
   * 10 minutes expiration.
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

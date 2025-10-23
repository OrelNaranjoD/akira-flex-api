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
import { JwtKeyManagerService } from './keys/jwt-key-manager.service';

/**
 * Token service for generating and verifying JWT tokens with key rotation support.
 * @class TokenService
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtKeyManager: JwtKeyManagerService
  ) {}

  /**
   * Generates a JWT token with custom payload and options.
   * @param payload - The token payload.
   * @param options - Options like expiration, etc.
   * @param options.expiresIn - Token expiration time (e.g., '1h', '600s').
   * @returns {string} - The generated JWT token.
   */
  generateToken(payload: object, options?: { expiresIn?: string | number }): Promise<string> {
    return this.jwtKeyManager.signToken(payload, options);
  }

  /**
   * Generates a refresh token (JWT) with REFRESH type.
   * Refresh tokens have expiration based on remember flag: 7 days if true, 1 day if false.
   * @param user - The user entity (PlatformUser or User).
   * @param remember - Whether to remember the user (longer expiration).
   * @returns {string} - The generated refresh token.
   */
  async generateRefreshToken(
    user: PlatformUser | User,
    remember: boolean = false
  ): Promise<string> {
    const payload: { sub: string; email: string; type: JwtPayloadType } = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.REFRESH,
    };
    const expiresIn = remember ? '7d' : '1d';
    return this.generateToken(payload, { expiresIn });
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
  async verifyRefreshToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtKeyManager.verifyToken<T>(token);
    } catch (error) {
      if (error.message?.includes('expired')) {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate refresh token and its hashed value to be stored in DB.
   * Returns the plain refresh token and the hash to persist.
   * @param user - The user entity (PlatformUser or User).
   * @param remember - Whether to remember the user (longer expiration).
   * @returns {Promise<{ refreshToken: string; refreshTokenHash: string }>} An object containing the plain refresh token and its hashed value.
   */
  async generateAndHashRefreshToken(
    user: PlatformUser | User,
    remember: boolean = false
  ): Promise<{ refreshToken: string; refreshTokenHash: string }> {
    const refreshToken = await this.generateRefreshToken(user, remember);
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
  async generateAccessToken(user: PlatformUser | User): Promise<TokenResponseDto> {
    let permissions = user.roles
      .flatMap((role) => role.permissions.map((p) => p.code))
      .filter((value, index, self) => self.indexOf(value) === index);
    const userType = 'active' in user ? 'PLATFORM' : 'LANDING';
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

    const isSuperAdmin =
      userType === 'PLATFORM' && user.roles.some((role) => role.name === 'SUPER_ADMIN');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
      permissions,
      type: userType === 'PLATFORM' ? JwtPayloadType.PLATFORM : JwtPayloadType.LANDING,
      ...(isSuperAdmin && { isSuperAdmin: true }),
    };
    const accessToken = await this.generateToken(payload, { expiresIn: '15m' });
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
  async generateEmailVerificationToken(user: User): Promise<string> {
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
  async generatePasswordResetToken(user: User): Promise<string> {
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
  async verifyToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtKeyManager.verifyToken<T>(token);
    } catch (error) {
      if (error.message?.includes('expired')) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

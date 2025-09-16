import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { PlatformUser } from './platform-users/entities/platform-user.entity';
import {
  JwtPayload,
  JwtPayloadType,
  JwtRefreshPayload,
  Status,
  RegisterResponseDto,
} from '@definitions';
import { User } from './users/entities/user.entity';
import { MailService } from '../../../core/mail/mail.service';
import { TokenService } from '../../../core/token/token.service';
import type { Request, Response } from 'express';

/**
 * Service responsible for platform authentication operations.
 * @class PlatformAuthService
 */
@Injectable()
export class PlatformAuthService {
  /**
   * Creates an instance of PlatformAuthService.
   * @param userPlatformRepository - Repository for platform users.
   * @param {Repository<PlatformUser>} userRepository - Repository for platform users.
   * @param {TokenService} tokenService - Service for generating and verifying tokens.
   * @param {MailService} mailService - Service for sending emails.
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userPlatformRepository: Repository<PlatformUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService
  ) {}

  /**
   * Sends the email verification link to an existing user.
   * @param email User email.
   * @returns {Promise<RegisterResponseDto>} Confirmation.
   * @throws {UnauthorizedException} If user not found or already active.
   */
  async resendVerificationEmail(email: string): Promise<RegisterResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.status === Status.ACTIVE) {
      throw new UnauthorizedException('User already verified');
    }
    const verificationToken = this.tokenService.generateEmailVerificationToken(user);
    await this.mailService.sendVerificationEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      verificationToken
    );
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      token: verificationToken,
    };
  }

  /**
   * Registers a new platform administrator user.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ConflictException} If user with email already exists.
   * @description Only accessible by super_admin role.
   */
  async registerPlatformUser(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.userPlatformRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    try {
      const user = this.userPlatformRepository.create(registerDto);
      await this.userPlatformRepository.save(user);

      return this.tokenService.generateAccessToken(user);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Email already in use');
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Registers a new user.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<RegisterResponseDto>} Registration result.
   * @throws {ConflictException} If user with email already exists.
   * @description Publicly accessible endpoint.
   */
  async registerUser(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepository.create({
      ...registerDto,
      status: Status.PENDING_VERIFICATION,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      const verificationToken = await this.generateEmailVerificationToken(savedUser);
      await this.mailService.sendVerificationEmail(
        savedUser.email,
        savedUser.firstName + ' ' + savedUser.lastName,
        verificationToken
      );

      return {
        id: savedUser.id,
        email: savedUser.email,
        status: savedUser.status,
        token: verificationToken,
      };
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Email already in use');
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Authenticates a platform user.
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   */
  async login(loginRequestDto: LoginRequestDto): Promise<{
    tokenResponse: TokenResponseDto;
    refreshToken?: string;
    refreshExpiresIn?: number;
  }> {
    const user = await this.validateUser(loginRequestDto.email, loginRequestDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLogin = new Date();

    // Generate refresh token and hash it for storage
    const { refreshToken, refreshTokenHash } =
      await this.tokenService.generateAndHashRefreshToken(user);

    user.refreshTokenHash = refreshTokenHash;
    await this.userPlatformRepository.save(user);

    const tokenResponse = this.tokenService.generateAccessToken(user);

    return { tokenResponse, refreshToken };
  }

  /**
   * Login and set refresh cookie on the provided response.
   * @param loginRequestDto - Login credentials DTO.
   * @param res - Express response to set the cookie.
   * @returns TokenResponseDto with access token info.
   */
  async loginWithCookie(
    loginRequestDto: LoginRequestDto,
    res: Response
  ): Promise<TokenResponseDto> {
    const { tokenResponse, refreshToken } = await this.login(loginRequestDto);
    if (refreshToken) {
      const cookieOptions = this.tokenService.getRefreshCookieOptions();
      res.cookie('refresh_token', refreshToken, cookieOptions);
    }
    return tokenResponse;
  }

  /**
   * Validates user credentials.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<PlatformUser | null>} User entity if valid, otherwise null.
   * @private
   */
  private async validateUser(email: string, password: string): Promise<PlatformUser | null> {
    const user = await this.userPlatformRepository.findOne({
      where: { email, active: true },
    });

    if (user && (await user.comparePassword(password))) {
      return user;
    }

    return null;
  }

  /**
   * Generates JWT tokens for a user.
   * @param {PlatformUser} user - User entity.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @private
   */
  private async generateTokens(user: PlatformUser | User): Promise<TokenResponseDto> {
    // Deprecated: use TokenService
    return this.tokenService.generateAccessToken(user);
  }

  /**
   * Generates JWT tokens for email verification.
   * @param {User} user - User entity.
   * @returns {Promise<string>} Verification token.
   * @private
   */
  private async generateEmailVerificationToken(user: User): Promise<string> {
    // Deprecated: use TokenService
    return this.tokenService.generateEmailVerificationToken(user);
  }

  /**
   * Generates JWT tokens for password reset.
   * @param {User} user - User entity.
   * @returns {Promise<string>} Password reset token.
   * @private
   */
  private async generatePasswordResetToken(user: User): Promise<string> {
    // Deprecated: use TokenService
    return this.tokenService.generatePasswordResetToken(user);
  }

  /**
   * Validates JWT payload.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<PlatformUser>} User entity.
   */
  async validatePayload(payload: JwtPayload): Promise<PlatformUser> {
    const user = await this.userPlatformRepository.findOne({
      where: { id: payload.sub, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Verifies a user's email using a token.
   * @param {string} token - Verification token.
   * @returns {Promise<TokenResponseDto>} Verification result.
   * @throws {UnauthorizedException} If token is invalid or user not found.
   */
  async verifyEmail(token: string): Promise<TokenResponseDto> {
    const payload = this.tokenService.verifyToken<JwtPayload>(token);
    if (payload.type !== JwtPayloadType.EMAIL_VERIFICATION) {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.status = Status.ACTIVE;
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  /**
   * Sends a recovery password email.
   * @param email User email.
   * @returns Promise resolving when the email is sent.
   * @throws {UnauthorizedException} If user not found.
   */
  async forgotPassword(email: string): Promise<RegisterResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const resetToken = await this.generatePasswordResetToken(user);
    await this.mailService.sendRecoveryPasswordEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      resetToken
    );
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      token: resetToken,
    };
  }

  /**
   * Resets a user's password using a token.
   * @param {string} token - Reset token.
   * @param {string} password - New password.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {UnauthorizedException} If token is invalid, expired, or user not found.
   */
  async resetPassword(token: string, password: string): Promise<TokenResponseDto> {
    const payload = this.tokenService.verifyToken<JwtPayload>(token);
    if (payload.type !== JwtPayloadType.PASSWORD_RESET) {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.password = password;
    await this.userRepository.save(user);
    return this.tokenService.generateAccessToken(user);
  }

  /**
   * Refreshes JWT tokens using a refresh token.
   * @param {string} token - Refresh token.
   * @returns {Promise<TokenResponseDto>} New authentication tokens.
   * @throws {UnauthorizedException} If token is invalid or user not found.
   */
  async refreshTokens(token: string): Promise<{
    tokenResponse: TokenResponseDto;
    refreshToken?: string;
    refreshExpiresIn?: number;
  }> {
    // Verify refresh token and payload
    const payload = this.tokenService.verifyRefreshToken<JwtRefreshPayload>(token);
    if (payload.type !== JwtPayloadType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userPlatformRepository.findOne({
      where: { id: payload.sub, active: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Ensure stored hash exists and matches provided token
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    const matches = await this.tokenService.compareRefreshTokenWithHash(
      token,
      user.refreshTokenHash
    );
    if (!matches) {
      // Possible token reuse / theft — revoke stored token and force logout
      user.refreshTokenHash = undefined;
      await this.userPlatformRepository.save(user);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token and rotate refresh token
    const tokenResponse = this.tokenService.generateAccessToken(user);

    // Rotate refresh token (generate new and store hash)
    const { refreshToken } = await this.tokenService.generateAndHashRefreshToken(user);
    await this.userPlatformRepository.save(user);

    return { tokenResponse, refreshToken };
  }

  /**
   * Handle refresh flow using request cookies and set rotated cookie on response.
   * @param req - Express request (reads cookie).
   * @param res - Express response (sets cookie).
   * @returns New authentication tokens.
   */
  async refreshWithCookie(req: Request, res: Response): Promise<TokenResponseDto> {
    const refreshToken = String(req.cookies?.refresh_token || '');
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const { tokenResponse, refreshToken: newRefreshToken } = await this.refreshTokens(refreshToken);

    if (newRefreshToken) {
      const cookieOptions = this.tokenService.getRefreshCookieOptions();
      res.cookie('refresh_token', newRefreshToken, cookieOptions);
    }

    return tokenResponse;
  }

  /**
   * Logout using cookies: revoke refresh token (if present) or force logout by userId, clear cookie.
   * @param req - Express request (reads cookie).
   * @param res - Express response (clears cookie).
   * @param userId - Optional user id to force logout.
   * @returns An object with a logout message.
   */
  async logoutFromRequest(
    req: Request,
    res: Response,
    userId?: string
  ): Promise<{ message: string }> {
    const refreshToken = String(req.cookies?.refresh_token || '');
    const result = await this.logout(refreshToken || undefined, userId);

    const clearOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    };
    res.clearCookie('refresh_token', clearOptions);
    return result;
  }

  /**
   * Logout user by invalidating the refresh token.
   * @param token Optional refresh token to revoke.
   * @param userId Optional user id to force logout (admin action).
   * @returns An object with a logout message.
   */
  async logout(token?: string, userId?: string): Promise<{ message: string }> {
    // If a refresh token is provided (from cookie), try to revoke it.
    if (token) {
      try {
        const payload = this.tokenService.verifyRefreshToken<JwtRefreshPayload>(token);
        const user = await this.userPlatformRepository.findOne({ where: { id: payload.sub } });
        if (user) {
          user.refreshTokenHash = undefined;
          await this.userPlatformRepository.save(user);
        }
        return { message: 'Logged out' };
      } catch {
        // If token is invalid or expired, treat as already logged out for idempotency.
        return { message: 'Logged out' };
      }
    }

    // Admin-forced logout by userId
    if (userId) {
      const user = await this.userPlatformRepository.findOne({ where: { id: userId } });
      if (user) {
        user.refreshTokenHash = undefined;
        await this.userPlatformRepository.save(user);
      }
      return { message: 'Logged out' };
    }

    // No token or userId provided: still return success (cookie will be cleared by controller).
    return { message: 'Logged out' };
  }
}

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
} from '../../../core/shared/definitions';
import { User } from './users/entities/user.entity';
import { MailService } from '../../../core/mail/mail.service';
import { TokenService } from '../../../core/token/token.service';
import type { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { Role } from './roles/entities/role.entity';

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
   * @param {Repository<User>} userRepository - Repository for users.
   * @param {Repository<Role>} roleRepository - Repository for roles.
   * @param {TokenService} tokenService - Service for generating and verifying tokens.
   * @param {MailService} mailService - Service for sending emails.
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userPlatformRepository: Repository<PlatformUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService
  ) {}

  /**
   * Sends the email verification link to an existing user.
   * @param email User email.
   * @returns {Promise<void>} Confirmation.
   * @throws {UnauthorizedException} If user not found or already active.
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.status === Status.ACTIVE) {
      throw new UnauthorizedException('User already verified');
    }
    const verificationPin = this.generateVerificationPin();
    Logger.debug(`Generated verification PIN for ${user.email}: ${verificationPin}`);
    const hashedPin = await this.hashPin(verificationPin);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationPin = hashedPin;
    user.verificationPinExpiresAt = expiresAt;
    await this.userRepository.save(user);

    await this.mailService.sendVerificationPinEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      verificationPin
    );
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
      const superAdminRole = await this.roleRepository.findOne({ where: { name: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        user.roles = [superAdminRole];
      }
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
   * @returns {Promise<{id: string, email: string, firstName: string, lastName: string, createdAt: string}>} The created user data.
   * @throws {ConflictException} If user with email already exists.
   * @description Publicly accessible endpoint.
   */
  async registerUser(registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }> {
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
      const verificationPin = this.generateVerificationPin();
      Logger.debug(`Generated verification PIN for ${savedUser.email}: ${verificationPin}`);
      const hashedPin = await this.hashPin(verificationPin);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      savedUser.verificationPin = hashedPin;
      savedUser.verificationPinExpiresAt = expiresAt;

      const userRole = await this.roleRepository.findOne({ where: { name: 'USER' } });
      if (userRole) {
        savedUser.roles = [userRole];
      }

      await this.userRepository.save(savedUser);

      await this.mailService.sendVerificationPinEmail(
        savedUser.email,
        savedUser.firstName + ' ' + savedUser.lastName,
        verificationPin
      );

      return {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        createdAt: savedUser.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Email already registered');
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

    const { refreshToken, refreshTokenHash } =
      await this.tokenService.generateAndHashRefreshToken(user);

    user.refreshTokenHash = refreshTokenHash;

    if ('active' in user) {
      await this.userPlatformRepository.save(user);
    } else {
      await this.userRepository.save(user);
    }

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
   * @returns {Promise<PlatformUser | User | null>} User entity if valid, otherwise null.
   * @private
   */
  private async validateUser(email: string, password: string): Promise<PlatformUser | User | null> {
    let user: PlatformUser | User | null = await this.userRepository.findOne({
      where: { email, status: Status.ACTIVE },
    });

    if (user && (await user.comparePassword(password))) {
      console.log('validateUser - found User:', { email, id: user.id, type: (user as any).type });
      return user;
    }

    user = await this.userPlatformRepository.findOne({
      where: { email, active: true },
    });

    if (user && (await user.comparePassword(password))) {
      console.log('validateUser - found PlatformUser:', { email, id: user.id, type: 'PLATFORM' });
      return user;
    }

    console.log('validateUser - user not found or invalid password:', email);
    return null;
  }

  /**
   * Generates a 6-digit verification PIN.
   * @returns {string} The generated PIN.
   * @private
   */
  private generateVerificationPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hashes a PIN for storage.
   * @param pin - The PIN to hash.
   * @returns {Promise<string>} The hashed PIN.
   * @private
   */
  private async hashPin(pin: string): Promise<string> {
    return this.tokenService.hashToken(pin);
  }

  /**
   * Compares a provided PIN with a stored hash.
   * @param pin - The plain PIN to compare.
   * @param hash - The stored hash to compare against.
   * @returns {Promise<boolean>} True if they match.
   * @private
   */
  private async comparePinWithHash(pin: string, hash: string): Promise<boolean> {
    return this.tokenService.compareRefreshTokenWithHash(pin, hash);
  }

  /**
   * Verifies a user's email using a PIN.
   * @param {string} email - User email.
   * @param {string} verificationCode - Verification code.
   * @returns {Promise<void>} Verification result.
   * @throws {UnauthorizedException} If code is invalid, expired, or user not found.
   */
  async verifyEmail(email: string, verificationCode: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.verificationPin || !user.verificationPinExpiresAt) {
      throw new UnauthorizedException('No verification PIN found');
    }
    if (new Date() > user.verificationPinExpiresAt) {
      throw new UnauthorizedException('Verification PIN expired');
    }
    const isValid = await this.comparePinWithHash(verificationCode, user.verificationPin);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }
    user.status = Status.ACTIVE;
    user.verificationPin = undefined;
    user.verificationPinExpiresAt = undefined;
    await this.userRepository.save(user);
  }

  /**
   * Sends a recovery password email.
   * @param email User email.
   * @returns Promise resolving when the email is sent.
   * @throws {UnauthorizedException} If user not found.
   */
  async forgotPassword(email: string): Promise<Omit<RegisterResponseDto, 'token'>> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const resetToken = this.tokenService.generatePasswordResetToken(user);
    await this.mailService.sendRecoveryPasswordEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      resetToken
    );
    return {
      id: user.id,
      email: user.email,
      status: user.status,
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
    const payload = this.tokenService.verifyRefreshToken<JwtRefreshPayload>(token);
    if (payload.type !== JwtPayloadType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    let user: PlatformUser | User | null = await this.userRepository.findOne({
      where: { id: payload.sub, status: Status.ACTIVE },
    });

    if (!user) {
      user = await this.userPlatformRepository.findOne({
        where: { id: payload.sub, active: true },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    const matches = await this.tokenService.compareRefreshTokenWithHash(
      token,
      user.refreshTokenHash
    );
    if (!matches) {
      user.refreshTokenHash = undefined;
      if ('active' in user) {
        await this.userPlatformRepository.save(user);
      } else {
        await this.userRepository.save(user);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenResponse = this.tokenService.generateAccessToken(user);

    const { refreshToken } = await this.tokenService.generateAndHashRefreshToken(user);

    if ('active' in user) {
      await this.userPlatformRepository.save(user);
    } else {
      await this.userRepository.save(user);
    }

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
   * Logout user by invalidating the refresh token.
   * @param token Optional refresh token to revoke.
   * @param userId Optional user id to force logout (admin action).
   * @returns An object with a logout message.
   */
  async logout(token?: string, userId?: string): Promise<{ message: string }> {
    if (token) {
      try {
        const payload = this.tokenService.verifyRefreshToken<JwtRefreshPayload>(token);

        let user: PlatformUser | User | null = await this.userRepository.findOne({
          where: { id: payload.sub },
        });

        if (!user) {
          user = await this.userPlatformRepository.findOne({ where: { id: payload.sub } });
        }

        if (user) {
          user.refreshTokenHash = undefined;
          if ('active' in user) {
            await this.userPlatformRepository.save(user);
          } else {
            await this.userRepository.save(user);
          }
        }
        return { message: 'Logged out' };
      } catch {
        return { message: 'Logged out' };
      }
    }

    if (userId) {
      let user: PlatformUser | User | null = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        user = await this.userPlatformRepository.findOne({ where: { id: userId } });
      }

      if (user) {
        user.refreshTokenHash = undefined;
        if ('active' in user) {
          await this.userPlatformRepository.save(user);
        } else {
          await this.userRepository.save(user);
        }
      }
      return { message: 'Logged out' };
    }

    return { message: 'Logged out' };
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
   * Finds a platform user by ID.
   * @param id - User ID.
   * @returns PlatformUser entity.
   */
  async findPlatformUser(id: string): Promise<PlatformUser> {
    const user = await this.userPlatformRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Finds a user by ID.
   * @param id - User ID.
   * @returns User entity.
   */
  async findUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
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
}

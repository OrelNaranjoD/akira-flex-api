import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { PlatformUser } from './platform-users/entities/platform-user.entity';
import {
  PlatformRole,
  JwtPayload,
  JwtPayloadType,
  Status,
  RegisterResponseDto,
  JwtEmailVerificationPayload,
} from '@definitions';
import { User } from './users/entities/user.entity';
import { MailService } from '../../../core/mail/mail.service';

/**
 * Service responsible for platform authentication operations.
 * @class PlatformAuthService
 */
@Injectable()
export class PlatformAuthService {
  /**
   * Service for platform authentication and authorization.
   * Handles user registration, login, JWT token generation and validation.
   * Implements RBAC using roles and permissions persisted in the database.
   *
   * @module PlatformAuthService
   */

  /**
   * Creates an instance of PlatformAuthService.
   * @param userPlatformRepository - Repository for platform users.
   * @param {Repository<PlatformUser>} userRepository - Repository for platform users.
   * @param {JwtService} jwtService - JWT service for token generation.
   * @param {MailService} mailService - Service for sending emails.
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userPlatformRepository: Repository<PlatformUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

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
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userPlatformRepository.create(registerDto);
    await this.userPlatformRepository.save(user);

    return this.generateTokens(user);
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
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      ...registerDto,
      status: Status.PENDING_VERIFICATION,
    });
    const savedUser = await this.userRepository.save(user);

    await this.mailService.sendVerificationEmail(
      savedUser.email,
      savedUser.firstName + ' ' + savedUser.lastName,
      await this.generateEmailVerificationToken(savedUser)
    );

    return {
      id: savedUser.id,
      email: savedUser.email,
      status: savedUser.status,
    };
  }

  /**
   * Authenticates a platform user.
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   */
  async login(loginRequestDto: LoginRequestDto): Promise<TokenResponseDto> {
    const user = await this.validateUser(loginRequestDto.email, loginRequestDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLogin = new Date();
    await this.userPlatformRepository.save(user);

    return this.generateTokens(user);
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
    const permissions = user.roles
      .flatMap((role) => role.permissions.map((p) => p.code))
      .filter((value, index, self) => self.indexOf(value) === index);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles as PlatformRole[],
      permissions,
      type: JwtPayloadType.PLATFORM,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }

  /**
   * Generates JWT tokens for email verification.
   * @param {User} user - User entity.
   * @returns {Promise<string>} Verification token.
   * @private
   */
  private async generateEmailVerificationToken(user: User): Promise<string> {
    const payload: JwtEmailVerificationPayload = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.EMAIL_VERIFICATION,
    };

    return this.jwtService.sign(payload, { expiresIn: '600s' });
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
    const payload = this.jwtService.verify<JwtPayload>(token);
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
}

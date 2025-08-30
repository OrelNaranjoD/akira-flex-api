import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayloadType } from '@orelnaranjod/flex-shared-lib';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { PlatformUser } from './users/entities/platform-user.entity';
//@TODO Fix import  to shared lib.
import { PlatformRole, JwtPayload } from '@definitions';

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
   * @param {Repository<PlatformUser>} userRepository - Repository for platform users.
   * @param {JwtService} jwtService - JWT service for token generation.
   */
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepository: Repository<PlatformUser>,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Registers a new platform administrator user.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ConflictException} If user with email already exists.
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(registerDto);
    await this.userRepository.save(user);

    return this.generateTokens(user);
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

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

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
    const user = await this.userRepository.findOne({
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
  private async generateTokens(user: PlatformUser): Promise<TokenResponseDto> {
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
      expiresIn: 3600, // 1 hour
      tokenType: 'Bearer',
    };
  }

  /**
   * Validates JWT payload.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<PlatformUser>} User entity.
   */
  async validatePayload(payload: JwtPayload): Promise<PlatformUser> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}

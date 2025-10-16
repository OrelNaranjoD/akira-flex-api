import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtPayload,
  PlatformRole,
  JwtPayloadType,
  JwtRefreshPayload,
} from '../../../core/shared/definitions';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import { TenantConnectionService } from '../../platform/tenants/services/tenant-connection.service';
import { TenantUser } from './users/tenant-user.entity';
import { TenantRole } from './roles/entities/tenant-role.entity';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';

/**
 * Service responsible for tenant authentication operations.
 * @class TenantAuthService
 */
@Injectable()
export class TenantAuthService {
  constructor(
    @InjectRepository(TenantUser)
    private readonly userRepository: Repository<TenantUser>,
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
    private readonly tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Registers a new tenant user in the correct tenant schema.
   * @param {string} tenantId - ID of the tenant.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ConflictException} If user with email already exists.
   * @throws {ForbiddenException} If tenant is not active or user limit exceeded.
   */
  async register(tenantId: string, registerDto: RegisterDto): Promise<TokenResponseDto> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    if (!schemaName) {
      throw new ForbiddenException('Tenant schema name is missing');
    }
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const userCount = await userRepository.count();
    if (userCount >= tenant.maxUsers) {
      throw new ForbiddenException('Maximum user limit reached for this tenant');
    }

    const existingUser = await userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    const user = userRepository.create({
      ...registerDto,
      tenantId,
    }) as TenantUser;
    const savedUser = await userRepository.save(user);

    return this.generateTokens(savedUser, tenantId);
  }

  /**
   * Creates the first admin user for a tenant (SUPER_ADMIN only).
   * @param {string} tenantId - ID of the tenant.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ConflictException} If admin user already exists.
   * @throws {ForbiddenException} If tenant is not active.
   */
  async createTenantAdmin(tenantId: string, registerDto: RegisterDto): Promise<TokenResponseDto> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    if (!schemaName) {
      throw new ForbiddenException('Tenant schema name is missing');
    }
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const existingAdmin = await userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: 'ADMIN' })
      .getOne();

    if (existingAdmin) {
      throw new ConflictException('Admin user already exists for this tenant');
    }

    const user = userRepository.create({
      ...registerDto,
      tenantId,
      roles: ['ADMIN'],
    }) as TenantUser;
    const savedUser = await userRepository.save(user);

    return this.generateTokens(savedUser, tenantId);
  }

  /**
   * Authenticates a tenant user from the correct tenant schema.
   * @param {string} tenantId - ID of the tenant.
   * @param {LoginDto} loginDto - User login credentials.
   * @returns {Promise<{tokenResponse: TokenResponseDto, refreshToken?: string, refreshExpiresIn?: number}>} Authentication tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   * @throws {ForbiddenException} If tenant is not active.
   */
  async login(
    tenantId: string,
    loginDto: LoginRequestDto
  ): Promise<{
    tokenResponse: TokenResponseDto;
    refreshToken?: string;
    refreshExpiresIn?: number;
  }> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const user = await this.validateUser(userRepository, loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLogin = new Date();

    const { refreshToken, refreshTokenHash } = await this.generateAndHashRefreshToken(user);
    user.refreshTokenHash = refreshTokenHash;

    await userRepository.save(user);

    const tokenResponse = await this.generateTokens(user, tenantId);

    return { tokenResponse, refreshToken };
  }

  /**
   * Validates user credentials against the tenant schema.
   * @param {Repository<TenantUser>} userRepository - User repository for the tenant.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<TenantUser>} User entity if valid.
   * @private
   */
  private async validateUser(
    userRepository: any,
    email: string,
    password: string
  ): Promise<TenantUser | null> {
    const user = await userRepository.findOne({
      where: { email, active: true },
    });

    if (user && (await user.comparePassword(password))) {
      return user;
    }

    return null;
  }

  /**
   *
   * @param user
   * @param tenantId
   */
  /**
   * Generates JWT tokens for a tenant user.
   * @param {TenantUser} user - The authenticated user.
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @private
   */
  private async generateTokens(user: TenantUser, tenantId: string): Promise<TokenResponseDto> {
    const tenant = await this.tenantService.findOneInternal(tenantId);
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';

    let userPermissions: string[] = [];
    if (schemaName && user.roles && user.roles.length > 0) {
      try {
        const roleRepository = await this.tenantConnectionService.getRepository(
          schemaName,
          TenantRole
        );
        const roles = await roleRepository.find({
          where: user.roles.map((roleName) => ({ name: roleName })),
        });

        userPermissions = roles.flatMap((role) => role.permissions || []);
        userPermissions = [...new Set(userPermissions)];
      } catch (error) {
        console.warn('Failed to resolve user permissions from roles:', error);
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: userPermissions,
      tenantId,
      type: JwtPayloadType.TENANT,
    };

    const accessToken = this.jwtService.sign({ ...payload } as JwtPayload);

    return {
      accessToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }

  /**
   * Validates JWT payload against the tenant schema.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<TenantUser>} User entity.
   */
  async validatePayload(payload: JwtPayload): Promise<TenantUser> {
    if (payload.roles?.includes(PlatformRole.SUPER_ADMIN)) {
      const mockUser = new TenantUser();
      mockUser.id = payload.sub;
      mockUser.email = payload.email;
      mockUser.roles = payload.roles as any;
      return mockUser;
    }

    if (!payload.tenantId) {
      throw new UnauthorizedException('Tenant ID is missing in token payload');
    }
    const tenant = await this.tenantService.findOneInternal(String(payload.tenantId));
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository<TenantUser>(
      schemaName,
      TenantUser as new () => TenantUser
    );

    const user = await userRepository.findOne({
      where: { id: payload.sub, active: true },
    });
    if (!user || !(user instanceof TenantUser)) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  /**
   * Finds all users for a specific tenant (DEBUG ONLY - remove after testing).
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<any[]>} List of users.
   */
  async debugFindUsers(tenantId: string): Promise<any[]> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const users = await userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'roles', 'active', 'createdAt', 'lastLogin'],
    });

    return users;
  }

  /**
   * Updates a user in a tenant (admin only).
   * @param {string} tenantId - ID of the tenant.
   * @param {string} userId - ID of the user.
   * @param {Partial<RegisterDto>} updateData - Data to update.
   * @returns {Promise<TenantUser>} Updated user.
   */
  async updateUser(
    tenantId: string,
    userId: string,
    updateData: Partial<RegisterDto>
  ): Promise<TenantUser> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const user = (await userRepository.findOne({
      where: { id: userId },
    })) as TenantUser;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;

    return userRepository.save(user);
  }

  /**
   * Generates a refresh token (JWT) with REFRESH type for tenant users.
   * Refresh tokens have a fixed expiration of 7 days.
   * @param user - The tenant user entity.
   * @returns {string} - The generated refresh token.
   */
  private generateRefreshToken(user: TenantUser): string {
    const payload: { sub: string; email: string; type: JwtPayloadType } = {
      sub: user.id,
      email: user.email,
      type: JwtPayloadType.REFRESH,
    };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  /**
   * Generate refresh token and its hashed value to be stored in DB for tenant users.
   * Returns the plain refresh token and the hash to persist.
   * @param user - The tenant user entity.
   * @returns {Promise<{ refreshToken: string; refreshTokenHash: string }>} An object containing the plain refresh token and its hashed value.
   */
  private async generateAndHashRefreshToken(user: TenantUser) {
    const refreshToken = this.generateRefreshToken(user);
    const saltRounds = 10;
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    return { refreshToken, refreshTokenHash };
  }

  /**
   * Compare a provided refresh token with a stored hash for tenant users.
   * @param token - The plain refresh token to compare.
   * @param hash - The stored hash to compare against.
   * @returns {Promise<boolean>} True if they match.
   */
  private async compareRefreshTokenWithHash(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /**
   * Refreshes JWT tokens using a refresh token.
   * @param {string} token - Refresh token.
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<{tokenResponse: TokenResponseDto, refreshToken?: string, refreshExpiresIn?: number}>} New authentication tokens.
   * @throws {UnauthorizedException} If token is invalid or user not found.
   */
  async refreshTokens(
    token: string,
    tenantId: string
  ): Promise<{
    tokenResponse: TokenResponseDto;
    refreshToken?: string;
    refreshExpiresIn?: number;
  }> {
    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== JwtPayloadType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    const tenant = await this.tenantService.findOneInternal(tenantId);
    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    const user = (await userRepository.findOne({
      where: { id: payload.sub, active: true },
    })) as TenantUser;

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const matches = await this.compareRefreshTokenWithHash(token, user.refreshTokenHash);

    if (!matches) {
      user.refreshTokenHash = null;
      await userRepository.save(user);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenResponse = await this.generateTokens(user, tenantId);

    const { refreshToken } = await this.generateAndHashRefreshToken(user);

    user.refreshTokenHash = (await this.generateAndHashRefreshToken(user)).refreshTokenHash;
    await userRepository.save(user);

    return { tokenResponse, refreshToken };
  }

  /**
   * Handle refresh flow using request cookies and set rotated cookie on response.
   * @param req - Express request (reads cookie).
   * @param res - Express response (sets cookie).
   * @param tenantId - ID of the tenant.
   * @returns New authentication tokens.
   */
  async refreshWithCookie(
    req: Request,
    res: Response,
    tenantId: string
  ): Promise<TokenResponseDto> {
    const refreshToken = String(req.cookies?.refresh_token || '');
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const { tokenResponse, refreshToken: newRefreshToken } = await this.refreshTokens(
      refreshToken,
      tenantId
    );

    if (newRefreshToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
        path: '/',
        maxAge: 604800000,
      };
      res.cookie('refresh_token', newRefreshToken, cookieOptions);
    }

    return tokenResponse;
  }

  /**
   * Logout user by invalidating the refresh token.
   * @param token Optional refresh token to revoke.
   * @param userId Optional user id to force logout (admin action).
   * @param tenantId ID of the tenant.
   * @returns An object with a logout message.
   */
  async logout(token?: string, userId?: string, tenantId?: string): Promise<{ message: string }> {
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for tenant logout');
    }

    const tenant = await this.tenantService.findOneInternal(tenantId);
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    if (token) {
      try {
        let payload: JwtRefreshPayload;
        try {
          payload = this.jwtService.verify<JwtRefreshPayload>(token);
        } catch {
          return { message: 'Logged out' };
        }

        const user = await userRepository.findOne({
          where: { id: payload.sub },
        });

        if (user) {
          user.refreshTokenHash = null;
          await userRepository.save(user);
        }
        return { message: 'Logged out' };
      } catch {
        return { message: 'Logged out' };
      }
    }

    if (userId) {
      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (user) {
        user.refreshTokenHash = null;
        await userRepository.save(user);
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
   * @param tenantId - ID of the tenant.
   * @returns An object with a logout message.
   */
  async logoutFromRequest(
    req: Request,
    res: Response,
    userId?: string,
    tenantId?: string
  ): Promise<{ message: string }> {
    const refreshToken = String(req.cookies?.refresh_token || '');
    const result = await this.logout(refreshToken || undefined, userId, tenantId);

    const clearOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    };
    res.clearCookie('refresh_token', clearOptions);
    return result;
  }
}

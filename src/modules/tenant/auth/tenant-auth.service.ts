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
  AdminRole,
  JwtPayloadType,
  RegisterDto,
  TokenResponseDto,
  LoginRequestDto,
} from '@orelnaranjod/flex-shared-lib';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import { TenantConnectionService } from '../../platform/tenants/services/tenant-connection.service';
import { UserTenant } from '../users/user-tenant.entity';

/**
 * Service responsible for tenant authentication operations.
 * @class TenantAuthService
 */
@Injectable()
export class TenantAuthService {
  /**
   * Creates an instance of TenantAuthService.
   * @param userRepository - Repository for tenant users.
   * @param {JwtService} jwtService - JWT service for token generation.
   * @param {TenantService} tenantService - Tenant service for validation.
   * @param {TenantConnectionService} tenantConnectionService - Tenant connection service.
   */
  constructor(
    @InjectRepository(UserTenant)
    private readonly userRepository: Repository<UserTenant>,
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
    // Check if tenant exists and is active
    const tenant = await this.tenantService.findOne(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    // Get repository for the specific tenant schema
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    if (!schemaName) {
      throw new ForbiddenException('Tenant schema name is missing');
    }
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, UserTenant);

    // Check user count
    const userCount = await userRepository.count();
    if (userCount >= tenant.maxUsers) {
      throw new ForbiddenException('Maximum user limit reached for this tenant');
    }

    // Check if user already exists in this tenant
    const existingUser = await userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    // Create user in the tenant schema
    const user = userRepository.create({
      ...registerDto,
    }) as UserTenant;
    const savedUser = await userRepository.save(user);

    return this.generateTokens(savedUser, tenantId);
  }

  /**
   * Authenticates a tenant user from the correct tenant schema.
   * @param {string} tenantId - ID of the tenant.
   * @param {LoginDto} loginDto - User login credentials.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   * @throws {ForbiddenException} If tenant is not active.
   */
  async login(tenantId: string, loginDto: LoginRequestDto): Promise<TokenResponseDto> {
    // Check if tenant exists and is active
    const tenant = await this.tenantService.findOne(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    // Get repository for the specific tenant schema
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, UserTenant);

    const user = await this.validateUser(userRepository, loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    return this.generateTokens(user, tenantId);
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
  ): Promise<UserTenant | null> {
    const user = await userRepository.findOne({
      where: { email, active: true },
    });

    if (user && (await user.comparePassword(password))) {
      return user;
    }

    return null;
  }

  /**
   * Generates JWT tokens for a user.
   * @param {TenantUser} user - User entity.
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @private
   */
  private async generateTokens(user: UserTenant, tenantId: string): Promise<TokenResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role as AdminRole),
      tenantId,
      type: JwtPayloadType.TENANT,
    };

    const accessToken = this.jwtService.sign({ ...payload } as JwtPayload);

    return {
      accessToken,
      expiresIn: 3600, // 1 hour
      tokenType: 'Bearer',
    };
  }

  /**
   * Validates JWT payload against the tenant schema.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<UserTenant>} User entity.
   */
  async validatePayload(payload: JwtPayload): Promise<UserTenant> {
    if (!payload.tenantId) {
      throw new UnauthorizedException('Tenant ID is missing in token payload');
    }
    const tenant = await this.tenantService.findOne(String(payload.tenantId));
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository<UserTenant>(
      schemaName,
      UserTenant
    );

    const user = await userRepository.findOne({
      where: { id: payload.sub, active: true },
    });
    if (!user || !(user instanceof UserTenant)) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  /**
   * Finds all users for a specific tenant.
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<any[]>} List of users.
   */
  async findUsers(tenantId: string): Promise<any[]> {
    const tenant = await this.tenantService.findOne(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    const users = await this.userRepository.find({
      where: { tenantId: tenantId },
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
  ): Promise<UserTenant> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId: tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  /**
   * Deactivates a user in a tenant (admin only).
   * @param {string} tenantId - ID of the tenant.
   * @param {string} userId - ID of the user.
   * @returns {Promise<void>}
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId: tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = false;
    await this.userRepository.save(user);
  }
}

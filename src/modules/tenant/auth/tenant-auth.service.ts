import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, PlatformRole, JwtPayloadType } from '../../../core/shared/definitions';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import { TenantConnectionService } from '../../platform/tenants/services/tenant-connection.service';
import { TenantUser } from './users/tenant-user.entity';

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
    // Check if tenant exists and is active
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    // Get repository for the specific tenant schema
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    if (!schemaName) {
      throw new ForbiddenException('Tenant schema name is missing');
    }
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

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
      tenantId, // Add tenant ID
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
    // Check if tenant exists and is active
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    // Get repository for the specific tenant schema
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    if (!schemaName) {
      throw new ForbiddenException('Tenant schema name is missing');
    }
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

    // Check if any admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { roles: ['ADMIN'] },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin user already exists for this tenant');
    }

    // Create admin user in the tenant schema
    const user = userRepository.create({
      ...registerDto,
      tenantId, // Add tenant ID
      roles: ['ADMIN'], // Assign admin role
    }) as TenantUser;
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
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

    // Get repository for the specific tenant schema
    const schemaName: string = (tenant as any).schemaName ?? (tenant as any).schema ?? '';
    const userRepository = await this.tenantConnectionService.getRepository(schemaName, TenantUser);

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
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: [],
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
   * @returns {Promise<TenantUser>} User entity.
   */
  async validatePayload(payload: JwtPayload): Promise<TenantUser> {
    // Allow SUPER_ADMIN users to access tenant routes without tenant validation
    if (payload.roles?.includes(PlatformRole.SUPER_ADMIN)) {
      // For SUPER_ADMIN, we don't need to validate against tenant schema
      // Return a mock user object to satisfy the return type
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
   * Finds all users for a specific tenant.
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<any[]>} List of users.
   */
  async findUsers(tenantId: string): Promise<any[]> {
    const tenant = await this.tenantService.findOneInternal(tenantId);

    if (!tenant.active) {
      throw new ForbiddenException('Tenant account is not active');
    }

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

    // Update only allowed fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;

    return userRepository.save(user);
  }

  /**
   * Deactivates a user in a tenant (admin only).
   * @param {string} tenantId - ID of the tenant.
   * @param {string} userId - ID of the user.
   * @returns {Promise<void>}
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
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

    user.active = false;
    await userRepository.save(user);
  }
}

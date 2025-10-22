import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformRole } from '../platform-roles/entities/platform-role.entity';
import { CreatePlatformUserDto } from './dtos/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dtos/update-platform-user.dto';
import { PlatformUserListResponseDto } from './dtos/platform-user-list-response.dto';
import { TenantService } from '../../tenants/services/tenant.service';
import { RegisterDto, UserRoles } from '@orelnaranjod/flex-shared-lib';
import { ToggleUserStatusDto } from '../../../tenant/auth/users/dtos/user-management.dto';

/**
 * Service for managing platform users.
 * @class PlatformUserService
 */
@Injectable()
export class PlatformUserService {
  constructor(
    @InjectRepository(PlatformUser)
    private readonly userRepository: Repository<PlatformUser>,
    @InjectRepository(PlatformRole)
    private readonly roleRepository: Repository<PlatformRole>,
    private readonly tenantService: TenantService
  ) {}

  /**
   * Creates a new platform user.
   * @param {CreatePlatformUserDto} dto - User creation data.
   * @returns {Promise<PlatformUser>} Created user.
   */
  async createUser(dto: CreatePlatformUserDto): Promise<PlatformUser> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  /**
   * Register a new platform user.
   * @param {RegisterDto} dto - User registration data.
   * @returns {Promise<PlatformUser>} Registered user.
   */
  async registerUser(dto: RegisterDto): Promise<PlatformUser> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    user.roles = [UserRoles.USER];
    return this.userRepository.save(user);
  }

  /**
   * Retrieves all platform users with pagination.
   * @param page - Page number (1-based, default: 1).
   * @param limit - Number of items per page (default: 10, max: 100).
   * @returns {Promise<PlatformUserListResponseDto>} Paginated list of users.
   */
  async findAll(page: number = 1, limit: number = 10): Promise<PlatformUserListResponseDto> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validPage - 1) * validLimit;

    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'roles',
        'active',
        'createdAt',
        'updatedAt',
        'lastLogin',
      ],
      relations: ['roles', 'roles.permissions'],
      skip,
      take: validLimit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / validLimit);

    const usersWithTenant = await Promise.all(
      users.map(async (user) => {
        const tenant = await this.getUserTenant(user.email);
        return {
          ...user,
          tenant: tenant || undefined,
        };
      })
    );

    return {
      users: usersWithTenant,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Retrieves a platform user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<PlatformUser>} Found user.
   */
  async findOne(id: string): Promise<PlatformUser> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'roles',
        'active',
        'createdAt',
        'updatedAt',
        'lastLogin',
      ],
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Updates a platform user.
   * @param {string} id - User ID.
   * @param {UpdatePlatformUserDto} dto - Update data.
   * @returns {Promise<PlatformUser>} Updated user.
   */
  async update(id: string, dto: UpdatePlatformUserDto): Promise<PlatformUser> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Soft deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.active = false;
    await this.userRepository.save(user);
  }

  /**
   * Restores a soft-deleted platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async restore(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.active = true;
    await this.userRepository.save(user);
  }

  /**
   * Toggles user active status.
   * @param id - User ID.
   * @param dto - New status.
   * @returns Updated user.
   */
  async toggleUserStatus(id: string, dto: ToggleUserStatusDto): Promise<PlatformUser> {
    const user = await this.findOne(id);
    user.active = dto.active;
    return this.userRepository.save(user);
  }

  /**
   * Hard deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Assign a role to a user.
   * @param {string} userId - User ID.
   * @param {string} roleId - Role ID.
   * @returns {Promise<void>}
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    if (!user.roles) user.roles = [] as any;

    const already = (user.roles as any[]).some((r) => r.id === role.id || r === role.id);
    if (!already) {
      (user.roles as any[]).push(role);
      await this.userRepository.save(user);
    }
  }

  /**
   * Returns owner information for a given user id.
   * Includes basic profile, roles and derived permission codes.
   * @param {string} userId - User id (UUID).
   * @returns Owner info object.
   */
  async getOwnerInfo(userId: string) {
    const user = await this.findOne(userId);
    const roles = (user.roles || []).map((r: any) => ({ id: r.id, name: r.name }));
    const permissions = (user.roles || [])
      .flatMap((r: any) => (r.permissions || []).map((p: any) => p.code))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles,
      permissions,
    };
  }

  /**
   * Determines the tenant associated with a user based on their email domain.
   * @param {string} email - User email.
   * @returns {Promise<any>} Tenant information or null if no tenant is associated.
   */
  private async getUserTenant(email: string): Promise<any> {
    try {
      if (email === 'landing@akiraflex.com') {
        return null;
      }

      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (!emailDomain) return null;

      const domainToTenantMap: { [key: string]: string } = {
        'repusa.com': 'repusa',
        'maestranzasunidos.cl': 'maestranzas-unidos',
        'akiraflex.com': 'akiraflex',
      };

      const tenantSubdomain = domainToTenantMap[emailDomain];
      if (!tenantSubdomain) return null;

      const tenant = await this.tenantService.findBySubdomain(tenantSubdomain);
      if (!tenant) return null;

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        email: tenant.email,
        active: tenant.active,
      };
    } catch {
      return null;
    }
  }
}

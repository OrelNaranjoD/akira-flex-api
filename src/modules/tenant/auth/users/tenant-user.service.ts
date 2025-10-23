import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Scope,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { TenantUser } from './tenant-user.entity';
import { TenantRole } from '../roles/entities/tenant-role.entity';
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';
import { TenantUserListResponseDto } from './dtos/tenant-user-list-response.dto';
import { TenantUserFiltersDto } from './dtos/tenant-user-filters.dto';
import { TenantOwnerFiltersDto } from './dtos/tenant-owner-filters.dto';
import { TenantOwnerListResponseDto } from './dtos/tenant-owner-list-response.dto';
import {
  UpdateUserRolesDto,
  ToggleUserStatusDto,
  TransferOwnershipDto,
} from './dtos/user-management.dto';
import { TenantConnectionService } from '../../../../modules/platform/tenants/services/tenant-connection.service';
import { TenantService } from '../../../../modules/platform/tenants/services/tenant.service';
import { Tenant } from '../../../../modules/platform/tenants/entities/tenant.entity';
import { TenantContextService } from '../../../../core/shared/tenant-context.service';
import type { Request } from 'express';
import { JwtPayload } from '../../../../core/shared/definitions';

/**
 * Service responsible for tenant user management operations.
 * @class TenantUserService
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantUserService {
  private tenant: Tenant | null = null;
  private schemaName: string | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService
  ) {}

  /**
   * Gets the current tenant based on the request context.
   * @returns {Promise<Tenant>} The current tenant entity.
   */
  private async getTenant(): Promise<Tenant> {
    if (this.tenant) {
      return this.tenant;
    }
    const tenantId = this.tenantContextService.getTenantId();
    const tenant = await this.tenantService.findOneInternal(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }
    this.tenant = tenant;
    return tenant;
  }

  /**
   * Gets the schema name for the current tenant.
   * @returns {Promise<string>} The schema name.
   */
  private async getSchemaName(): Promise<string> {
    if (this.schemaName) {
      return this.schemaName;
    }
    this.schemaName = this.tenantContextService.getSchemaName();
    return this.schemaName;
  }

  /**
   * Gets a repository for a specific entity from the current tenant's schema.
   * @param {EntityTarget<T>} entity - The entity target.
   * @returns {Promise<Repository<T>>} The repository for the specified entity.
   */
  private async getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>
  ): Promise<Repository<T>> {
    const schema = await this.getSchemaName();
    return this.tenantConnectionService.getRepository(schema, entity);
  }

  /**
   * Creates user.
   * @param dto - User data.
   * @returns Created user.
   */
  async createUser(dto: CreateTenantUserDto): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const existing = await userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');
    const user = userRepository.create(dto);
    return userRepository.save(user);
  }

  /**
   * Registers user.
   * @param dto - Registration data.
   * @returns Registered user.
   */
  async registerUser(dto: CreateTenantUserDto): Promise<TenantUser> {
    return this.createUser(dto);
  }

  /**
   * Finds all users with pagination and optional filters.
   * @param page - Page number.
   * @param limit - Items per page.
   * @param filters - Optional filters to apply to the search.
   * @returns Paginated and filtered users.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: TenantUserFiltersDto
  ): Promise<TenantUserListResponseDto> {
    const userRepository = await this.getRepository(TenantUser);
    const skip = (page - 1) * limit;

    const queryBuilder = userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.roles',
        'user.active',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (filters) {
      if (filters.email) {
        queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
          email: `%${filters.email}%`,
        });
      }

      if (filters.firstName) {
        queryBuilder.andWhere('LOWER(user.firstName) LIKE LOWER(:firstName)', {
          firstName: `%${filters.firstName}%`,
        });
      }

      if (filters.lastName) {
        queryBuilder.andWhere('LOWER(user.lastName) LIKE LOWER(:lastName)', {
          lastName: `%${filters.lastName}%`,
        });
      }

      if (filters.phone) {
        queryBuilder.andWhere('user.phone LIKE :phone', {
          phone: `%${filters.phone}%`,
        });
      }

      if (filters.role) {
        queryBuilder.andWhere(":role = ANY(string_to_array(user.roles, ','))", {
          role: filters.role,
        });
      }

      if (typeof filters.active === 'boolean') {
        queryBuilder.andWhere('user.active = :active', { active: filters.active });
      }

      if (filters.createdFrom) {
        queryBuilder.andWhere('user.createdAt >= :createdFrom', {
          createdFrom: filters.createdFrom,
        });
      }

      if (filters.createdTo) {
        queryBuilder.andWhere('user.createdAt <= :createdTo', {
          createdTo: filters.createdTo,
        });
      }
    }

    queryBuilder
      .orderBy(
        `CASE
        WHEN 'OWNER' = ANY(string_to_array(user.roles, ',')) THEN 1
        WHEN 'ADMIN' = ANY(string_to_array(user.roles, ',')) THEN 2
        WHEN 'MANAGER' = ANY(string_to_array(user.roles, ',')) THEN 3
        ELSE 4
        END`
      )
      .addOrderBy('user.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      users: users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Finds tenant owners with optional filters and pagination.
   * @param filters - Optional filters to apply.
   * @param page - Page number (1-based, default: 1).
   * @param limit - Number of items per page (default: 10, max: 100).
   * @returns {Promise<TenantOwnerListResponseDto>} Paginated and filtered list of owners.
   */
  async findOwners(
    filters?: TenantOwnerFiltersDto,
    page: number = 1,
    limit: number = 10
  ): Promise<TenantOwnerListResponseDto> {
    const userRepository = await this.getRepository(TenantUser);
    const skip = (page - 1) * limit;

    const queryBuilder = userRepository
      .createQueryBuilder('user')
      .where(":role = ANY(string_to_array(user.roles, ','))", { role: 'OWNER' });

    if (filters) {
      if (filters.email) {
        queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
          email: `%${filters.email}%`,
        });
      }

      if (filters.firstName) {
        queryBuilder.andWhere('LOWER(user.firstName) LIKE LOWER(:firstName)', {
          firstName: `%${filters.firstName}%`,
        });
      }

      if (filters.lastName) {
        queryBuilder.andWhere('LOWER(user.lastName) LIKE LOWER(:lastName)', {
          lastName: `%${filters.lastName}%`,
        });
      }

      if (filters.active !== undefined) {
        queryBuilder.andWhere('user.active = :active', { active: filters.active });
      }

      if (filters.createdFrom) {
        queryBuilder.andWhere('user.createdAt >= :createdFrom', {
          createdFrom: filters.createdFrom,
        });
      }

      if (filters.createdTo) {
        queryBuilder.andWhere('user.createdAt <= :createdTo', {
          createdTo: filters.createdTo,
        });
      }
    }

    queryBuilder.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [owners, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      owners,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Finds user by ID.
   * @param id - User ID.
   * @returns User entity.
   */
  async findOne(id: string): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User tenant not found');
    return user;
  }

  /**
   * Updates user.
   * @param id - User ID.
   * @param dto - Update data.
   * @returns Updated user.
   */
  async update(id: string, dto: UpdateTenantUserDto): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User tenant not found');
    }
    Object.assign(user, dto);
    return userRepository.save(user);
  }

  /**
   * Soft deletes user.
   * @param id - User ID.
   */
  async remove(id: string): Promise<void> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User tenant not found');
    }
    user.active = false;
    await userRepository.save(user);
  }

  /**
   * Toggles user status.
   * @param id - User ID.
   * @param dto - New status.
   * @returns Updated user.
   */
  async toggleUserStatus(id: string, dto: ToggleUserStatusDto): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!dto.active && user.roles.includes('OWNER')) {
      const ownerCount = await userRepository
        .createQueryBuilder('user')
        .where('user.active = :active', { active: true })
        .andWhere(":role = ANY(string_to_array(user.roles, ','))", { role: 'OWNER' })
        .getCount();
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot disable the last owner of the tenant');
      }
    }
    user.active = dto.active;
    return userRepository.save(user);
  }

  /**
   * Updates user roles.
   * @param id - User ID.
   * @param dto - New roles.
   * @returns Updated user.
   */
  async updateUserRoles(id: string, dto: UpdateUserRolesDto): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const roleRepository = await this.getRepository(TenantRole);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const existingRoles = await roleRepository.find({
      where: dto.roles.map((roleName) => ({ name: roleName })),
    });
    if (existingRoles.length !== dto.roles.length) {
      const foundRoleNames = existingRoles.map((r) => r.name);
      const invalidRoles = dto.roles.filter((role) => !foundRoleNames.includes(role));
      throw new NotFoundException(`Invalid roles: ${invalidRoles.join(', ')}`);
    }
    user.roles = dto.roles;
    return userRepository.save(user);
  }

  /**
   * Assign a role to a user.
   * @param userId - User ID.
   * @param roleName - Role name to assign.
   * @returns Updated user.
   */
  async assignRole(userId: string, roleName: string): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const roleRepository = await this.getRepository(TenantRole);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    if (!user.roles.includes(roleName)) {
      user.roles = [...user.roles, roleName];
      return userRepository.save(user);
    }

    return user;
  }

  /**
   * Transfers ownership.
   * @param dto - Transfer data.
   * @returns Success message.
   */
  async transferOwnership(dto: TransferOwnershipDto): Promise<{ message: string }> {
    const userRepository = await this.getRepository(TenantUser);
    const newOwner = await userRepository.findOne({
      where: { id: dto.newOwnerId, active: true },
    });
    if (!newOwner) {
      throw new NotFoundException('New owner user not found or inactive');
    }

    const currentOwner = await userRepository
      .createQueryBuilder('user')
      .where(":role = ANY(string_to_array(user.roles, ','))", { role: 'OWNER' })
      .getOne();
    if (!currentOwner) {
      throw new NotFoundException('Current owner not found');
    }

    currentOwner.roles = currentOwner.roles.filter((role) => role !== 'OWNER');
    newOwner.roles = [...new Set([...newOwner.roles, 'OWNER'])];

    await userRepository.manager.transaction(async (manager) => {
      await manager.save(currentOwner);
      await manager.save(newOwner);
    });
    return { message: 'Ownership transferred successfully' };
  }

  /**
   * Hard deletes user.
   * @param id - User ID.
   */
  async hardDeleteUser(id: string): Promise<void> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.roles.includes('OWNER')) {
      const ownerCount = await userRepository
        .createQueryBuilder('user')
        .where('user.active = :active', { active: true })
        .andWhere(":role = ANY(string_to_array(user.roles, ','))", { role: 'OWNER' })
        .getCount();
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot delete the last owner of the tenant');
      }
    }
    await userRepository.delete(id);
  }

  /**
   * Gets current user profile.
   * @returns User profile.
   */
  async getCurrentUserProfile(): Promise<any> {
    const payload = this.request.user as JwtPayload;
    const userId = payload.sub;
    if (!userId) {
      throw new ForbiddenException('User ID (sub) not found in auth payload');
    }
    const tenant = await this.getTenant();
    const userRepository = await this.getRepository(TenantUser);
    const roleRepository = await this.getRepository(TenantRole);
    const user = await userRepository.findOne({
      where: { id: userId },
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
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let permissions: string[] = [];
    if (user.roles && user.roles.length > 0) {
      const roles = await roleRepository.find({
        where: user.roles.map((roleName) => ({ name: roleName })),
      });
      permissions = [...new Set(roles.flatMap((role) => role.permissions || []))];
    }
    return {
      ...user,
      permissions: permissions,
      tenantId: tenant.id,
      tenantName: tenant.name,
    };
  }
}

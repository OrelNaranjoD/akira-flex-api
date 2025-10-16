import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Scope,
} from '@nestjs/common';
import { Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { TenantUser } from './tenant-user.entity';
import { TenantRole } from '../roles/entities/tenant-role.entity';
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';
import { TenantUserListResponseDto } from './dtos/tenant-user-list-response.dto';
import {
  UpdateUserRolesDto,
  ToggleUserStatusDto,
  TransferOwnershipDto,
} from './dtos/user-management.dto';
import { TenantConnectionService } from '../../../../modules/platform/tenants/services/tenant-connection.service';
import { TenantService } from '../../../../modules/platform/tenants/services/tenant.service';
import { Tenant } from '../../../../modules/platform/tenants/entities/tenant.entity';
import { TenantContextService } from '../../../../core/shared/tenant-context.service';

/**
 * Service responsible for tenant user management operations.
 * @class TenantUserService
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantUserService {
  private tenant: Tenant | null = null;
  private schemaName: string | null = null;
  private readonly authUser: { sub?: string; tenantId?: string };

  constructor(
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
   * Creates a new user tenant.
   * @param {CreateTenantUserDto} dto - The data transfer object containing user information.
   * @returns {Promise<TenantUser>} The created tenant user.
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
   * Registers a new user tenant.
   * @param {CreateTenantUserDto} dto - The data transfer object containing registration information.
   * @returns {Promise<TenantUser>} The registered tenant user.
   */
  async registerUser(dto: CreateTenantUserDto): Promise<TenantUser> {
    return this.createUser(dto);
  }

  /**
   * Retrieves all tenant users with pagination.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of items per page.
   * @returns {Promise<TenantUserListResponseDto>} A paginated list of tenant users.
   */
  async findAll(page: number = 1, limit: number = 10): Promise<TenantUserListResponseDto> {
    const userRepository = await this.getRepository(TenantUser);
    const skip = (page - 1) * limit;
    const [users, total] = await userRepository
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
      ])
      .orderBy(
        `CASE
        WHEN 'OWNER' = ANY(user.roles) THEN 1
        WHEN 'ADMIN' = ANY(user.roles) THEN 2
        WHEN 'MANAGER' = ANY(user.roles) THEN 3
        ELSE 4
        END`
      )
      .addOrderBy('user.createdAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
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
   * Finds a user tenant by ID.
   * @param {string} id - The ID of the tenant user.
   * @returns {Promise<TenantUser>} The tenant user entity.
   */
  async findOne(id: string): Promise<TenantUser> {
    const userRepository = await this.getRepository(TenantUser);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User tenant not found');
    return user;
  }

  /**
   * Updates a user tenant.
   * @param {string} id - The ID of the tenant user to update.
   * @param {UpdateTenantUserDto} dto - The data transfer object containing updated user information.
   * @returns {Promise<TenantUser>} The updated tenant user.
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
   * Deactivates a user tenant (soft delete).
   * @param {string} id - The ID of the tenant user to remove.
   * @returns {Promise<void>}
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
   * Toggles user active status (enable/disable user).
   * @param {string} id - The ID of the tenant user.
   * @param {ToggleUserStatusDto} dto - The data transfer object containing the new status.
   * @returns {Promise<TenantUser>} The updated tenant user.
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
        .andWhere(':role = ANY(user.roles)', { role: 'OWNER' })
        .getCount();
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot disable the last owner of the tenant');
      }
    }
    user.active = dto.active;
    return userRepository.save(user);
  }

  /**
   * Updates roles for a specific tenant user.
   * @param {string} id - The ID of the tenant user.
   * @param {UpdateUserRolesDto} dto - The DTO containing the new list of roles.
   * @returns {Promise<TenantUser>} The updated tenant user.
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
   * Transfers ownership from current owner to another user.
   * @param {TransferOwnershipDto} dto - DTO containing the new owner's ID.
   * @returns {Promise<{ message: string }>} A success message.
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
      .where(':role = ANY(user.roles)', { role: 'OWNER' })
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
   * Hard deletes a user tenant (permanent deletion).
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<void>}
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
        .andWhere(':role = ANY(user.roles)', { role: 'OWNER' })
        .getCount();
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot delete the last owner of the tenant');
      }
    }
    await userRepository.delete(id);
  }

  /**
   * Gets current user profile with roles and permissions.
   * @returns {Promise<any>} The current tenant user's profile.
   */
  async getCurrentUserProfile(): Promise<any> {
    const userId = this.authUser?.sub;
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

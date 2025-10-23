import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantSeeder } from './tenant.seeder';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import { PlatformUserService } from '@platform/auth/platform-users/platform-user.service';
import { PlatformRoleService } from '@platform/auth/platform-roles/platform-role.service';

/**
 * Seeder for RepUSA tenant and its users.
 */
@Injectable()
export class RepUSATenantSeeder {
  private readonly logger = new Logger(RepUSATenantSeeder.name);

  constructor(
    private readonly tenantSeeder: TenantSeeder,
    private readonly configService: ConfigService,
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly platformUserService: PlatformUserService,
    private readonly platformRoleService: PlatformRoleService
  ) {}

  /**
   * Seeds the RepUSA tenant with users.
   */
  async seed(): Promise<void> {
    const tenant = await this.tenantSeeder.createTenant({
      name: 'RepUSA',
      subdomain: 'repusa',
      email: 'admin@repusa.com',
      phone: '+525577778888',
      maxUsers: 50,
      modules: ['auth', 'users', 'roles', 'permissions'],
    });

    await this.createTenantUsers(tenant);
    await this.createPlatformUsersForOwners(tenant);
  }

  /**
   * Creates users for the RepUSA tenant.
   * @param tenant
   */
  private async createTenantUsers(tenant: Tenant): Promise<void> {
    const schemaName = tenant.schemaName;
    const tenantUserRepository = await this.tenantConnectionService.getRepository(
      schemaName,
      TenantUser
    );

    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (!password) {
      throw new Error('SUPER_ADMIN_PASSWORD environment variable is required.');
    }

    const repUSAUsers = [
      {
        email: 'owner@repusa.com',
        firstName: 'RepUSA',
        lastName: 'Owner',
        phone: '+525577778888',
        roles: ['OWNER'],
      },
      {
        email: 'admin@repusa.com',
        firstName: 'RepUSA',
        lastName: 'Admin',
        phone: '+525577779999',
        roles: ['ADMIN'],
      },
      {
        email: 'manager@repusa.com',
        firstName: 'RepUSA',
        lastName: 'Manager',
        phone: '+525577771111',
        roles: ['MANAGER'],
      },
      {
        email: 'employee1@repusa.com',
        firstName: 'RepUSA',
        lastName: 'Employee One',
        phone: '+525577772222',
        roles: ['USER'],
      },
      {
        email: 'employee2@repusa.com',
        firstName: 'RepUSA',
        lastName: 'Employee Two',
        phone: '+525577773333',
        roles: ['USER'],
      },
    ];

    for (const userData of repUSAUsers) {
      await this.createOrUpdateUser(tenantUserRepository, {
        ...userData,
        password,
        tenantId: tenant.id,
      });
    }
  }

  /**
   * Creates platform users for tenant owners to allow platform-level control.
   * @param tenant
   */
  private async createPlatformUsersForOwners(tenant: Tenant): Promise<void> {
    const ownerUser = {
      email: 'owner@repusa.com',
      firstName: 'RepUSA',
      lastName: 'Owner (Platform)',
      phone: '+525577778888',
      tenantId: tenant.id,
      tenantName: tenant.name,
    };

    const existingUsers = await this.platformUserService.findAll(1, 1000);
    const existingUser = existingUsers.users.find((u) => u.email === ownerUser.email);

    if (!existingUser) {
      const platformUser = await this.platformUserService.createUser({
        email: ownerUser.email,
        password: this.configService.get<string>('SUPER_ADMIN_PASSWORD') || 'defaultPassword',
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
        phone: ownerUser.phone,
        roles: ['USER'],
      });

      const allRoles = await this.platformRoleService.findAll();
      const basicRole = allRoles.find((role) => role.name === 'USER');
      if (basicRole) {
        await this.platformUserService.assignRole(platformUser.id, basicRole.id);
      }
    }
  }

  /**
   * Creates or updates a tenant user.
   * @param repository
   * @param userData
   * @param userData.email
   * @param userData.password
   * @param userData.firstName
   * @param userData.lastName
   * @param userData.phone
   * @param userData.roles
   * @param userData.tenantId
   */
  private async createOrUpdateUser(
    repository: any,
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      roles: string[];
      tenantId: string;
    }
  ): Promise<void> {
    const existingUser = await repository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      Object.assign(existingUser, userData);
      existingUser.active = true;
      await repository.save(existingUser);
    } else {
      const newUser = repository.create({
        ...userData,
        active: true,
      });
      await repository.save(newUser);
    }
  }
}

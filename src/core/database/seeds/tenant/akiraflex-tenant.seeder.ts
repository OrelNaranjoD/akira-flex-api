import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantSeeder } from './tenant.seeder';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';

/**
 * Seeder for AkiraFlex tenant and its users.
 */
@Injectable()
export class AkiraFlexTenantSeeder {
  private readonly logger = new Logger(AkiraFlexTenantSeeder.name);

  constructor(
    private readonly tenantSeeder: TenantSeeder,
    private readonly configService: ConfigService,
    private readonly tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Seeds the AkiraFlex tenant with users.
   */
  async seed(): Promise<void> {
    const tenant = await this.tenantSeeder.createTenant({
      name: 'AkiraFlex',
      subdomain: 'akiraflex',
      email: 'admin@akiraflex.com',
      phone: '+525566667777',
      maxUsers: 100,
      modules: ['auth', 'users', 'roles', 'permissions'],
    });

    await this.createTenantUsers(tenant);
    this.logger.log('AkiraFlex tenant and users seeded successfully.');
  }

  /**
   * Creates users for the AkiraFlex tenant.
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

    // Owner user
    await this.createOrUpdateUser(tenantUserRepository, {
      email: 'owner@akiraflex.com',
      password,
      firstName: 'AkiraFlex',
      lastName: 'Owner',
      phone: '+525566667777',
      roles: ['OWNER'],
      tenantId: tenant.id,
    });

    // Admin user
    await this.createOrUpdateUser(tenantUserRepository, {
      email: 'admin@akiraflex.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+525511111111',
      roles: ['ADMIN'],
      tenantId: tenant.id,
    });

    // Manager user
    await this.createOrUpdateUser(tenantUserRepository, {
      email: 'manager@akiraflex.com',
      password,
      firstName: 'Manager',
      lastName: 'User',
      phone: '+525522222222',
      roles: ['MANAGER'],
      tenantId: tenant.id,
    });

    // Regular users
    const regularUsers = [
      {
        email: 'user1@akiraflex.com',
        firstName: 'Regular',
        lastName: 'User One',
        phone: '+525533333333',
      },
      {
        email: 'user2@akiraflex.com',
        firstName: 'Regular',
        lastName: 'User Two',
        phone: '+525544444444',
      },
      // Additional users for pagination testing
      {
        email: 'user3@akiraflex.com',
        firstName: 'Test',
        lastName: 'User Three',
        phone: '+525555555555',
      },
      {
        email: 'user4@akiraflex.com',
        firstName: 'Test',
        lastName: 'User Four',
        phone: '+525566666666',
      },
      {
        email: 'user5@akiraflex.com',
        firstName: 'Test',
        lastName: 'User Five',
        phone: '+525577777777',
      },
      {
        email: 'manager2@akiraflex.com',
        firstName: 'Senior',
        lastName: 'Manager',
        phone: '+525588888888',
        roles: ['MANAGER'],
      },
      {
        email: 'manager3@akiraflex.com',
        firstName: 'Project',
        lastName: 'Manager',
        phone: '+525599999999',
        roles: ['MANAGER'],
      },
      {
        email: 'admin2@akiraflex.com',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+525511111112',
        roles: ['ADMIN'],
      },
      {
        email: 'user6@akiraflex.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+525522222223',
      },
      {
        email: 'user7@akiraflex.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+525533333334',
      },
      {
        email: 'user8@akiraflex.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '+525544444445',
      },
      {
        email: 'user9@akiraflex.com',
        firstName: 'Alice',
        lastName: 'Williams',
        phone: '+525555555556',
      },
      {
        email: 'user10@akiraflex.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        phone: '+525566666667',
      },
    ];

    for (const userData of regularUsers) {
      await this.createOrUpdateUser(tenantUserRepository, {
        ...userData,
        password,
        roles: userData.roles || ['USER'],
        tenantId: tenant.id,
      });
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
      this.logger.log(`User ${userData.email} already exists, updating if necessary.`);
      Object.assign(existingUser, userData);
      existingUser.active = true;
      await repository.save(existingUser);
    } else {
      const newUser = repository.create({
        ...userData,
        active: true,
      });
      await repository.save(newUser);
      this.logger.log(`Created user: ${userData.email} with role: ${userData.roles[0]}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantSeeder } from './tenant.seeder';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Seeder for TestCorp tenant and its users.
 */
@Injectable()
export class TestCorpTenantSeeder {
  private readonly logger = new Logger(TestCorpTenantSeeder.name);

  constructor(
    private readonly tenantSeeder: TenantSeeder,
    private readonly configService: ConfigService,
    private readonly tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Seeds the TestCorp tenant with users.
   */
  async seed(): Promise<void> {
    const tenant = await this.tenantSeeder.createTenant({
      name: 'TestCorp',
      subdomain: 'testcorp',
      email: 'admin@testcorp.com',
      phone: '+525577778888',
      maxUsers: 50,
      modules: ['auth', 'users', 'roles', 'permissions'],
    });

    await this.createTenantUsers(tenant);
    this.logger.log('TestCorp tenant and users seeded successfully.');
  }

  /**
   * Creates users for the TestCorp tenant.
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

    const testCorpUsers = [
      {
        email: 'owner@testcorp.com',
        firstName: 'TestCorp',
        lastName: 'Owner',
        phone: '+525577778888',
        roles: ['OWNER'],
      },
      {
        email: 'admin@testcorp.com',
        firstName: 'TestCorp',
        lastName: 'Admin',
        phone: '+525577779999',
        roles: ['ADMIN'],
      },
      {
        email: 'manager@testcorp.com',
        firstName: 'TestCorp',
        lastName: 'Manager',
        phone: '+525577771111',
        roles: ['MANAGER'],
      },
      {
        email: 'employee1@testcorp.com',
        firstName: 'TestCorp',
        lastName: 'Employee One',
        phone: '+525577772222',
        roles: ['USER'],
      },
      {
        email: 'employee2@testcorp.com',
        firstName: 'TestCorp',
        lastName: 'Employee Two',
        phone: '+525577773333',
        roles: ['USER'],
      },
    ];

    for (const userData of testCorpUsers) {
      await this.createOrUpdateUser(tenantUserRepository, {
        ...userData,
        password,
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

    // Always hash the password before saving
    const hashedPassword = await this.hashPassword(userData.password);

    if (existingUser) {
      this.logger.log(`TestCorp user ${userData.email} already exists, updating if necessary.`);
      Object.assign(existingUser, userData);
      existingUser.password = hashedPassword; // Update with hashed password
      existingUser.active = true;
      await repository.save(existingUser);
    } else {
      const newUser = repository.create({
        ...userData,
        password: hashedPassword, // Use hashed password
        active: true,
      });
      await repository.save(newUser);
      this.logger.log(`Created TestCorp user: ${userData.email} with role: ${userData.roles[0]}`);
    }
  }

  /**
   * Hashes a password using bcrypt.
   * @param password Plain text password.
   * @returns Hashed password.
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

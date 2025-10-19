import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantSeeder } from './tenant.seeder';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Seeder for Maestranzas Unidos S.A. Tenant and its users.
 */
@Injectable()
export class MaestranzasUnidosTenantSeeder {
  private readonly logger = new Logger(MaestranzasUnidosTenantSeeder.name);

  constructor(
    private readonly tenantSeeder: TenantSeeder,
    private readonly configService: ConfigService,
    private readonly tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Seeds the Maestranzas Unidos S.A. Tenant with users.
   */
  async seed(): Promise<void> {
    const tenant = await this.tenantSeeder.createTenant({
      name: 'Maestranzas Unidos S.A.',
      subdomain: 'maestranzas-unidos',
      email: 'admin@maestranzasunidos.cl',
      phone: '+56912345678',
      maxUsers: 75,
      modules: ['auth', 'users', 'roles', 'permissions'],
    });

    await this.createTenantUsers(tenant);
    this.logger.log('Maestranzas Unidos S.A. tenant and users seeded successfully.');
  }

  /**
   * Creates users for the Maestranzas Unidos S.A. Tenant.
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

    const maestranzasUsers = [
      {
        email: 'gerente.general@maestranzasunidos.cl',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        phone: '+56912345678',
        roles: ['OWNER'],
      },
      {
        email: 'admin@maestranzasunidos.cl',
        firstName: 'María',
        lastName: 'González',
        phone: '+56912345679',
        roles: ['ADMIN'],
      },
      {
        email: 'jefe.operaciones@maestranzasunidos.cl',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+56912345680',
        roles: ['MANAGER'],
      },
      {
        email: 'jefe.mantenimiento@maestranzasunidos.cl',
        firstName: 'Pedro',
        lastName: 'Sánchez',
        phone: '+56912345681',
        roles: ['MANAGER'],
      },
      {
        email: 'supervisor.minas@maestranzasunidos.cl',
        firstName: 'Ana',
        lastName: 'Martínez',
        phone: '+56912345682',
        roles: ['MANAGER'],
      },
      {
        email: 'tecnico1@maestranzasunidos.cl',
        firstName: 'Roberto',
        lastName: 'López',
        phone: '+56912345683',
        roles: ['USER'],
      },
      {
        email: 'tecnico2@maestranzasunidos.cl',
        firstName: 'Carmen',
        lastName: 'Díaz',
        phone: '+56912345684',
        roles: ['USER'],
      },
      {
        email: 'operador1@maestranzasunidos.cl',
        firstName: 'Miguel',
        lastName: 'Fernández',
        phone: '+56912345685',
        roles: ['USER'],
      },
      {
        email: 'operador2@maestranzasunidos.cl',
        firstName: 'Isabel',
        lastName: 'Ruiz',
        phone: '+56912345686',
        roles: ['USER'],
      },
      {
        email: 'seguridad@maestranzasunidos.cl',
        firstName: 'Antonio',
        lastName: 'Morales',
        phone: '+56912345687',
        roles: ['USER'],
      },
      {
        email: 'logistica@maestranzasunidos.cl',
        firstName: 'Patricia',
        lastName: 'Jiménez',
        phone: '+56912345688',
        roles: ['USER'],
      },
      {
        email: 'compras@maestranzasunidos.cl',
        firstName: 'Francisco',
        lastName: 'Torres',
        phone: '+56912345689',
        roles: ['USER'],
      },
    ];

    for (const userData of maestranzasUsers) {
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

    const hashedPassword = await this.hashPassword(userData.password);

    if (existingUser) {
      this.logger.log(`User ${userData.email} already exists, updating if necessary.`);
      Object.assign(existingUser, userData);
      existingUser.password = hashedPassword;
      existingUser.active = true;
      await repository.save(existingUser);
    } else {
      const newUser = repository.create({
        ...userData,
        password: hashedPassword,
        active: true,
      });
      await repository.save(newUser);
      this.logger.log(`Created user: ${userData.email} with role: ${userData.roles[0]}`);
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

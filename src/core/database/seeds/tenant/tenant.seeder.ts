import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TenantRole } from '@tenant/auth/roles/entities/tenant-role.entity';
import { Permission } from '@platform/auth/permissions/entities/permission.entity';
import { TENANT_ROLES_DATA } from '../data/tenant-roles.data';

/**
 * Base seeder for tenant operations.
 */
@Injectable()
export class TenantSeeder {
  private readonly logger = new Logger(TenantSeeder.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantConnectionService: TenantConnectionService
  ) {}

  /**
   * Creates a tenant with the given configuration.
   * @param tenantData Configuration data for the tenant.
   * @param tenantData.name
   * @param tenantData.subdomain
   * @param tenantData.email
   * @param tenantData.phone
   * @param tenantData.maxUsers
   * @param tenantData.modules
   * @returns The created or existing tenant.
   */
  async createTenant(tenantData: {
    name: string;
    subdomain: string;
    email: string;
    phone: string;
    maxUsers: number;
    modules: string[];
  }): Promise<Tenant> {
    const tenantRepo = this.dataSource.getRepository(Tenant);

    const existingTenant = await tenantRepo.findOne({
      where: { subdomain: tenantData.subdomain },
    });

    if (existingTenant) {
      return existingTenant;
    }

    const schemaName = tenantData.subdomain.toLowerCase();
    const tenant = tenantRepo.create({
      ...tenantData,
      schemaName,
      active: true,
    });

    const savedTenant = await tenantRepo.save(tenant);

    await this.createTenantSchema(schemaName);
    await this.createTenantRoles(schemaName);

    return savedTenant;
  }

  /**
   * Creates the tenant schema.
   * @param schemaName
   */
  private async createTenantSchema(schemaName: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Creates tenant roles in the tenant schema.
   * @param schemaName
   */
  private async createTenantRoles(schemaName: string): Promise<void> {
    const tenantRoleRepository = await this.tenantConnectionService.getRepository(
      schemaName,
      TenantRole
    );

    const tenantPermissionRepo = this.dataSource.getRepository(Permission);
    const savedTenantPerms = await tenantPermissionRepo.find();
    const allPermissions = savedTenantPerms.map((p) => p.code);

    for (const roleData of TENANT_ROLES_DATA) {
      const existingRole = await tenantRoleRepository.findOne({
        where: { name: roleData.name },
      });

      const permissions = roleData.getPermissions(allPermissions);

      if (existingRole) {
        existingRole.permissions = permissions;
        await tenantRoleRepository.save(existingRole);
      } else {
        const role = tenantRoleRepository.create({
          name: roleData.name,
          permissions,
        });
        await tenantRoleRepository.save(role);
      }
    }
  }
}

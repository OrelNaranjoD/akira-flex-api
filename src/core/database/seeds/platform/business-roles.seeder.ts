import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '@platform/auth/roles/entities/role.entity';
import { Permission } from '@platform/auth/permissions/entities/permission.entity';
import { Role as RoleEnum } from '@shared/definitions';

/**
 * Seeder for business roles (tenant-level roles stored in platform DB).
 */
@Injectable()
export class BusinessRolesSeeder {
  private readonly logger = new Logger(BusinessRolesSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Seeds business roles with their permissions.
   */
  async seed(): Promise<void> {
    const roleRepo = this.dataSource.getRepository(Role);
    const permissionRepo = this.dataSource.getRepository(Permission);

    const tenantPermissions = await permissionRepo.find();

    const roles = Object.values(RoleEnum).map((roleName) => ({
      name: roleName,
      permissions: roleName === 'USER' || roleName === 'OWNER' ? tenantPermissions : [],
    }));

    for (const roleData of roles) {
      const role = roleRepo.create({
        name: roleData.name as string,
        permissions: roleData.permissions,
      });
      await roleRepo.save(role);
      this.logger.log(`Created business role: ${roleData.name}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlatformRole } from '@platform/auth/platform-roles/entities/platform-role.entity';
import { PlatformPermission } from '@platform/auth/platform-permissions/entities/platform-permission.entity';
import { PLATFORM_ROLES_DATA } from '../data/platform-roles.data';

/**
 * Seeder for platform roles.
 */
@Injectable()
export class PlatformRolesSeeder {
  private readonly logger = new Logger(PlatformRolesSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Seeds platform roles with their permissions.
   */
  async seed(): Promise<void> {
    const roleRepo = this.dataSource.getRepository(PlatformRole);
    const permissionRepo = this.dataSource.getRepository(PlatformPermission);
    const allPermissions = await permissionRepo.find();

    for (const roleData of PLATFORM_ROLES_DATA) {
      const existingRole = await roleRepo.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        let permissions: PlatformPermission[] = [];

        if (roleData.name === 'SUPER_ADMIN') {
          permissions = allPermissions;
        } else if (roleData.name === 'AUDITOR') {
          const auditorPerm = allPermissions.find((p) => p.code === 'PERMISSION_VIEW_ALL');
          permissions = auditorPerm ? [auditorPerm] : [];
        } else if (roleData.name === 'USER') {
          const basicPermCodes = [
            'USER_ROLE_VIEW_OWN',
            'USER_VIEW',
            'TENANT_VIEW',
            'TENANT_VIEW_ALL',
          ];
          permissions = allPermissions.filter((p) => basicPermCodes.includes(p.code));
        }

        const role = roleRepo.create({
          name: roleData.name,
          permissions,
        } as unknown as Partial<PlatformRole>);
        await roleRepo.save(role);
      }
    }
  }
}

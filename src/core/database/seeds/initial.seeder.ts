import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformUser } from '../../../modules/platform/auth/platform-users/entities/platform-user.entity';
import { PlatformPermission } from '../../../modules/platform/auth/platform-permissions/entities/platform-permission.entity';
import { PlatformRole } from '../../../modules/platform/auth/platform-roles/entities/platform-role.entity';
import { Role } from '../../../modules/platform/auth/roles/entities/role.entity';
import { Role as RoleEnum } from '@shared';

/**
 * Seeder that creates the initial platform administrator user in platform_users if the table is empty.
 * This ensures that the platform always has an admin user after a database reset or first initialization.
 */
@Injectable()
export class InitialSeeder {
  private readonly logger = new Logger(InitialSeeder.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  /**
   * Creates the initial platform administrator user only if the platform_users table is empty.
   * This method is useful for development and first-time deployments, ensuring that protected routes are accessible.
   */
  async seed(): Promise<void> {
    const count = await this.dataSource.getRepository(PlatformUser).count();
    const envPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (count === 0) {
      // Create initial permissions
      const permissionRepo = this.dataSource.getRepository(PlatformPermission);
      const roleRepo = this.dataSource.getRepository(PlatformRole);

      const perms = [
        { code: 'PERMISSION_CREATE', description: 'Create permissions' },
        { code: 'PERMISSION_VIEW_ALL', description: 'View all permissions' },
        { code: 'PERMISSION_UPDATE', description: 'Update permissions' },
        { code: 'PERMISSION_DELETE', description: 'Delete permissions' },
        { code: 'USER_ROLE_VIEW_OWN', description: 'View own user role' },
        { code: 'USER_VIEW', description: 'View user details' },
        { code: 'USER_CREATE', description: 'Create new users' },
        { code: 'USER_UPDATE', description: 'Update existing users' },
        { code: 'USER_DELETE', description: 'Delete users' },
        { code: 'AUDIT_VIEW_ALL', description: 'View all audit logs' },
        { code: 'AUDIT_VIEW', description: 'View audit logs' },
        { code: 'AUDIT_TENANT_VIEW', description: 'View tenant audit logs' },
        { code: 'ROLE_VIEW_ALL', description: 'View all roles' },
        { code: 'ROLE_VIEW_OWN', description: 'View own role' },
        { code: 'ROLE_CREATE', description: 'Create new roles' },
        { code: 'ROLE_UPDATE', description: 'Update existing roles' },
        { code: 'ROLE_DELETE', description: 'Delete roles' },
      ];

      const savedPerms = await permissionRepo.save(perms);

      // Create roles and assign permissions business roles for tenant
      const businessRoleRepo = this.dataSource.getRepository(Role);
      const roles = Object.values(RoleEnum).map((roleName) => ({
        name: roleName,
        permissions: roleName === 'OWNER' ? savedPerms : [],
      }));
      await businessRoleRepo.save(roles);

      // Create roles and assign permissions
      const superAdminRole = roleRepo.create({
        name: 'SUPER_ADMIN',
        permissions: savedPerms,
      } as unknown as Partial<PlatformRole>);

      const _auditor = savedPerms.find((p: any) => p.code === 'PERMISSION_VIEW_ALL');
      const auditorPerm = _auditor as PlatformPermission;
      const auditorRole = roleRepo.create({
        name: 'AUDITOR',
        permissions: [auditorPerm],
      } as unknown as Partial<PlatformRole>);

      const savedRoles = await roleRepo.save([superAdminRole, auditorRole]);

      // Create the initial admin user for the platform and assign SUPER_ADMIN role
      const admin = new PlatformUser();
      admin.email = 'admin@akiraflex.com';
      admin.password = envPassword!;
      admin.firstName = 'Platform';
      admin.lastName = 'Administrator';
      admin.phone = '+525566667777';
      admin.roles = [savedRoles.find((r: any) => r.name === 'SUPER_ADMIN')];
      admin.active = true;
      await this.dataSource.getRepository(PlatformUser).save(admin);
      this.logger.log('Platform administrator user created with initial roles and permissions.');
    } else {
      this.logger.log('Platform users already exist, no action taken.');
    }
  }
}

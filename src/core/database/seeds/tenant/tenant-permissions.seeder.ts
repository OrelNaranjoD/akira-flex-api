import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permission } from '@platform/auth/permissions/entities/permission.entity';
import { TENANT_PERMISSIONS_DATA } from '../data/tenant-permissions.data';

/**
 * Seeder for tenant permissions.
 */
@Injectable()
export class TenantPermissionsSeeder {
  private readonly logger = new Logger(TenantPermissionsSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Seeds tenant permissions if they don't exist.
   */
  async seed(): Promise<void> {
    const permissionRepo = this.dataSource.getRepository(Permission);

    const existingPermissions = await permissionRepo.find();
    const existingCodes = existingPermissions.map((p) => p.code);

    const permissionsToCreate = TENANT_PERMISSIONS_DATA.filter(
      (permission) => !existingCodes.includes(permission.code)
    );

    if (permissionsToCreate.length === 0) {
      this.logger.log('All tenant permissions already exist.');
      return;
    }

    const savedPermissions = await permissionRepo.save(permissionsToCreate);
    this.logger.log(`Created ${savedPermissions.length} tenant permissions.`);
  }
}

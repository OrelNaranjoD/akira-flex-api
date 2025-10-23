import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlatformPermission } from '@platform/auth/platform-permissions/entities/platform-permission.entity';
import { PLATFORM_PERMISSIONS_DATA } from '../data/platform-permissions.data';

/**
 * Seeder for platform permissions.
 */
@Injectable()
export class PlatformPermissionsSeeder {
  private readonly logger = new Logger(PlatformPermissionsSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Seeds platform permissions.
   */
  async seed(): Promise<void> {
    const permissionRepo = this.dataSource.getRepository(PlatformPermission);

    for (const permissionData of PLATFORM_PERMISSIONS_DATA) {
      const existingPermission = await permissionRepo.findOne({
        where: { code: permissionData.code },
      });

      if (!existingPermission) {
        await permissionRepo.save(permissionData);
      }
    }
  }
}

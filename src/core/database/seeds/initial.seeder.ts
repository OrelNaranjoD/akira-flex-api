import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformUser } from '../../../modules/platform/auth/users/entities/platform-user.entity';

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
      // Create the initial admin user for the platform
      const admin = new PlatformUser();
      admin.email = 'admin@akiraflex.com';
      admin.password = envPassword!;
      admin.firstName = 'Platform';
      admin.lastName = 'Administrator';
      admin.phone = '+525566667777';
      admin.roles = ['super_admin'];
      admin.active = true;
      await this.dataSource.getRepository(PlatformUser).save(admin);
      this.logger.log('Platform administrator user created.');
    } else {
      this.logger.log('Platform users already exist, no action taken.');
    }
  }
}

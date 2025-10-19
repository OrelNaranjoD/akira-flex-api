import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformUser } from '@platform/auth/platform-users/entities/platform-user.entity';
import { PlatformRole } from '@platform/auth/platform-roles/entities/platform-role.entity';
import { PLATFORM_USERS_DATA } from '../data/platform-users.data';

/**
 * Seeder for platform users.
 */
@Injectable()
export class PlatformUsersSeeder {
  private readonly logger = new Logger(PlatformUsersSeeder.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  /**
   * Seeds platform users.
   */
  async seed(): Promise<void> {
    const userRepo = this.dataSource.getRepository(PlatformUser);
    const roleRepo = this.dataSource.getRepository(PlatformRole);

    const envPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (!envPassword) {
      throw new Error('SUPER_ADMIN_PASSWORD environment variable is required.');
    }

    for (const userData of PLATFORM_USERS_DATA) {
      const role = await roleRepo.findOne({
        where: { name: userData.roleName },
      });

      if (!role) {
        throw new Error(
          `${userData.roleName} role not found. Please run PlatformRolesSeeder first.`
        );
      }

      const user = userRepo.create({
        email: userData.email,
        password: envPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        roles: [role],
        active: true,
      });

      await userRepo.save(user);
      this.logger.log(`Created platform user: ${userData.email} with role: ${userData.roleName}`);
    }
  }
}

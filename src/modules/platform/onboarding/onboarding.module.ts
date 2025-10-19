import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PlatformAuthModule } from '../auth/platform-auth.module';
import { TenantManagementModule } from '../tenants/tenant-management.module';
import { TenantAuthModule } from '../../tenant/auth/tenant-auth.module';
import { PlatformUsersModule } from '../auth/platform-users/platform-user.module';

/**
 * Module for onboarding operations.
 */
@Module({
  imports: [PlatformAuthModule, TenantManagementModule, TenantAuthModule, PlatformUsersModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}

import { Injectable } from '@nestjs/common';
import { PlatformAuthService } from '../auth/platform-auth.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { TenantService } from '../tenants/services/tenant.service';
import { TenantAuthService } from '../../tenant/auth/tenant-auth.service';
import { PlatformUserService } from '../auth/platform-users/platform-user.service';
import { TenantRequestStatus } from '../auth/platform-users/entities/platform-user.entity';

/**
 * Service for onboarding operations.
 */
@Injectable()
export class OnboardingService {
  constructor(
    private readonly authService: PlatformAuthService,
    private readonly tenantService: TenantService,
    private readonly tenantAuthService: TenantAuthService,
    private readonly platformUserService: PlatformUserService
  ) {}

  /**
   * Registers a new user and requests tenant creation (pending admin approval).
   * @param registerDto - User registration data.
   * @returns Registration result.
   */
  async registerUserAndRequestTenant(registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantRequestStatus: string;
    createdAt: string;
  }> {
    const user = await this.platformUserService.registerUser(registerDto);
    await this.platformUserService.update(user.id, {
      tenantRequestStatus: TenantRequestStatus.PENDING,
      requestedCompanyName: `${registerDto.firstName} ${registerDto.lastName}'s Company`,
      requestedSubdomain: registerDto.email.split('@')[0],
    });

    return {
      id: user.id,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      tenantRequestStatus: TenantRequestStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies email.
   * @param email - User email.
   * @param verificationCode - Verification code.
   */
  async verifyEmail(email: string, verificationCode: string): Promise<void> {
    await this.authService.verifyEmail(email, verificationCode);
  }

  /**
   * Resends verification email.
   * @param email - User email.
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await this.authService.resendVerificationEmail(email);
  }
}

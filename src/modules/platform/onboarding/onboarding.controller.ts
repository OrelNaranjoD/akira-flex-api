import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { Public } from '../../../core/decorators/public.decorator';
import { ResendVerificationDto } from '../auth/dtos/resend-verification.dto';
import { ResendVerificationResponseDto } from '../auth/dtos/resend-verification-response.dto';
import { VerifyEmailDto } from '../auth/dtos/verify-email.dto';
import { VerifyEmailResponseDto } from '../auth/dtos/verify-email-response.dto';
import { LoginRequestDto } from '../auth/dtos/login-request.dto';
import { TokenResponseDto } from '../auth/dtos/token-response.dto';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { PlatformAuthService } from '../auth/platform-auth.service';

/**
 * Controller for onboarding operations.
 * @class OnboardingController
 * @description /onboarding.
 */
@Controller('/onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly platformAuthService: PlatformAuthService
  ) {}

  /**
   * Registers a new user and requests tenant creation (pending admin approval).
   * @param registerDto - User registration data.
   * @returns Registration result.
   * @description POST /register.
   * Publicly accessible endpoint.
   */
  @Public()
  @HttpCode(201)
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantRequestStatus: string;
    createdAt: string;
  }> {
    return this.onboardingService.registerUserAndRequestTenant(registerDto);
  }

  /**
   * Verifies a email address using verification code.
   * @param verifyEmailDto - Object containing email and verificationCode.
   * @returns Success message.
   * @description POST /verify-email.
   */
  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    await this.onboardingService.verifyEmail(verifyEmailDto.email, verifyEmailDto.verificationCode);
    return { message: 'Email verified successfully' };
  }

  /**
   * Resends the email verification code.
   * @param resendVerificationDto - Object containing email.
   * @returns Success message.
   * @description POST /resend-verification.
   */
  @Public()
  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto
  ): Promise<ResendVerificationResponseDto> {
    await this.onboardingService.resendVerificationEmail(resendVerificationDto.email);
    return { message: 'Verification code sent' };
  }

  /**
   * Authenticates a landing user.
   * @param loginRequestDto - User login credentials.
   * @param res - Response object to set refresh cookie.
   * @returns Authentication tokens.
   * @description POST /login.
   */
  @Public()
  @Post('login')
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokenResponseDto> {
    return this.platformAuthService.loginWithCookie(loginRequestDto, res);
  }
}

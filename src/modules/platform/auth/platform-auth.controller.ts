import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { PlatformPermissionGuard } from './platform-permissions/guards/platform-permission.guard';
import { RequirePlatformPermission } from './platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission, RegisterResponseDto } from '@definitions';
import { Public } from '../../../core/decorators/public.decorator';

/**
 * Controller for platform authentication operations.
 * @class PlatformAuthController
 * @description /auth.
 */
@Controller('/auth')
export class PlatformAuthController {
  /**
   * Creates an instance of PlatformAuthController.
   * @param {PlatformAuthService} authService - Platform authentication service.
   */
  constructor(private readonly authService: PlatformAuthService) {}

  /**
   * Registers a new platform administrator (super admin only).
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /register.
   * Only accessible by super_admin role.
   */
  @Post('platform/register')
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.AUTH_REGISTER)
  async registerPlatformUser(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.registerPlatformUser(registerDto);
  }

  /**
   * Registers a new user.
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<RegisterResponseDto>} Registration result.
   * @description POST /register.
   * Publicly accessible endpoint.
   * Sends a verification email upon successful registration.
   */
  @Public()
  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.registerUser(registerDto);
  }

  /**
   * Authenticates a platform user.
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /login.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequestDto: LoginRequestDto): Promise<TokenResponseDto> {
    return this.authService.login(loginRequestDto);
  }

  /**
   * Verifies a email address.
   * @param {string} token - Verification token.
   * @returns {Promise<{ message: string }>} Verification result.
   * @description PATCH /verify-email?token=...
   */
  @Patch('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string): Promise<TokenResponseDto> {
    return this.authService.verifyEmail(token);
  }
}

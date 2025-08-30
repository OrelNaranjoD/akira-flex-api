import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { PlatformPermissionGuard } from './permissions/guards/platform-permission.guard';
import { RequirePlatformPermission } from './permissions/decorators/platform-permissions.decorator';
//@TODO Fix import to shared lib.
import { PlatformPermission } from '@definitions';

/**
 * Controller for platform authentication operations.
 * @class PlatformAuthController
 * @description /platform/auth.
 */
@Controller('platform/auth')
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
  @Post('register')
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.AUTH_REGISTER)
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(registerDto);
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
}

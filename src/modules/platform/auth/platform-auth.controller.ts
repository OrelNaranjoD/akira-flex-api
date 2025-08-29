import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PlatformJwtAuthGuard } from './guards/platform-jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { UserRoles } from '@orelnaranjod/flex-shared-lib';
import { PlatformAuthService } from './platform-auth.service';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';

/**
 * Controller for platform authentication operations.
 * @class PlatformAuthController
 * @description /auth/platform.
 */
@Controller('auth/platform')
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
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN)
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

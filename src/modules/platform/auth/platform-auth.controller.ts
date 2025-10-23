import { Controller, Post, Body, Patch, Query, Req, Res, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PlatformAuthService } from './platform-auth.service';
import { RegisterDto } from './dtos/register.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { RequirePlatformPermission } from './platform-permissions/decorators/platform-permissions.decorator';
import {
  PlatformPermission,
  RegisterResponseDto,
  JwtPayload,
} from '../../../core/shared/definitions';
import { Public } from '../../../core/decorators/public.decorator';
import { TokenService } from '../../../core/token/token.service';
import { User } from './users/entities/user.entity';
import { PlatformUser } from './platform-users/entities/platform-user.entity';

/**
 * Controller for platform authentication operations.
 * @class PlatformAuthController
 * @description /auth/platform.
 */
@Controller('/auth/platform')
export class PlatformAuthController {
  constructor(
    private readonly authService: PlatformAuthService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Registers a new platform administrator (super admin only).
   * @param {RegisterDto} registerDto - User registration data.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /register.
   * Only accessible by super_admin role.
   */
  @Post('register')
  @RequirePlatformPermission(PlatformPermission.AUTH_REGISTER)
  async registerPlatformUser(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.registerPlatformUser(registerDto);
  }

  /**
   * Authenticates a platform user.
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @param {Response} res - Response object to set refresh cookie.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /login.
   */
  @Public()
  @Post('login')
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokenResponseDto> {
    return this.authService.loginWithCookie(loginRequestDto, res);
  }

  /**
   * Sends a recovery password email.
   * @param {string} email - User email.
   * @returns {Promise<RegisterResponseDto>} Result of the operation.
   * @description POST /forgot-password.
   * Publicly accessible endpoint.
   */
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<Omit<RegisterResponseDto, 'token'>> {
    return this.authService.forgotPassword(email);
  }

  /**
   * Reset password using a valid token.
   * @param token The password reset token.
   * @param password The new password.
   * @returns {Promise<TokenResponseDto>} New authentication tokens.
   * @description PATCH /reset-password?token=...
   * Publicly accessible endpoint.
   */
  @Public()
  @Patch('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body('password') password: string
  ): Promise<TokenResponseDto> {
    return this.authService.resetPassword(token, password);
  }

  /**
   * Refreshes authentication tokens using a valid refresh token.
   * @param {Request} req - Request object to read refresh cookie.
   * @param {Response} res - Response object to set rotated refresh cookie.
   * @returns {Promise<TokenResponseDto>} New authentication tokens.
   * @description POST /refresh-token.
   */
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokenResponseDto> {
    return this.authService.refreshWithCookie(req, res);
  }

  /**
   * Gets the current user's profile.
   * @param {Request} req - Request object containing authenticated user.
   * @returns {Promise<UserProfileDto>} User profile data.
   * @description GET /profile.
   * Requires authentication.
   */
  @Get('profile')
  async getProfile(@Req() req: Request): Promise<any> {
    const payload = req.user as JwtPayload;
    let user: User | PlatformUser;
    if (payload.type === 'PLATFORM') {
      user = await this.authService.findPlatformUser(payload.sub);
    } else {
      user = await this.authService.findUser(payload.sub);
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles.map((r) => r.name),
      type: payload.type,
      status: 'status' in user ? user.status : undefined,
      active: 'active' in user ? user.active : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }

  /**
   * Logout user by invalidating the refresh token.
   * @param {Request} req - Request object to read refresh cookie.
   * @param {Response} res - Response object to clear cookie.
   * @param {string} [userId] - Optional user id to force logout (admin action).
   * @returns {Promise<{ message: string }>} Logout confirmation message.
   * @description POST /logout.
   */
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('userId') userId?: string
  ): Promise<{ message: string }> {
    return this.authService.logoutFromRequest(req, res, userId);
  }
}

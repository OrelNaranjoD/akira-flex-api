import { Controller, Post, Body, Param, Request, Get, Req, Res } from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { RequireTenantPermission } from './tenant-permissions/decorators/tenant-permissions.decorator';
import { TenantPermission, JwtPayload } from '../../../core/shared/definitions';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Public } from '../../../core/decorators/public.decorator';

/**
 * Controller for tenant authentication operations.
 * @class TenantAuthController
 * @description /auth/tenant.
 */
@Controller('/auth/tenant')
export class TenantAuthController {
  constructor(
    private readonly authService: TenantAuthService,
    private readonly tenantService: TenantService
  ) {}

  /**
   * Authenticates a tenant user.
   * @param loginRequestDto - User login credentials.
   * @param request - HTTP request.
   * @param res - Response object to set refresh cookie.
   * @returns Authentication tokens.
   */
  @Public()
  @Post('login')
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Request() request: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse
  ): Promise<TokenResponseDto> {
    return this.authService.loginWithTenantResolution(loginRequestDto, request, res);
  }

  /**
   * Registers new tenant user.
   * @param registerDto - User data.
   * @param request - HTTP request.
   * @returns Tokens.
   */
  @Post('register')
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  async register(@Body() registerDto: RegisterDto, @Request() request): Promise<TokenResponseDto> {
    const targetTenantId = String(request.user.tenantId);
    return this.authService.register(targetTenantId, registerDto);
  }

  /**
   * Debug endpoint for users.
   * @param tenantId - Tenant ID.
   * @returns User list.
   */
  @Get('debug-users/:tenantId')
  async debugUsers(@Param('tenantId') tenantId: string): Promise<any[]> {
    return this.authService.debugFindUsers(tenantId);
  }

  /**
   * Refreshes authentication tokens.
   * @param req - Request object.
   * @param res - Response object.
   * @param request - HTTP request.
   * @returns New tokens.
   */
  @Post('refresh-token')
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Request() request
  ): Promise<TokenResponseDto> {
    return this.authService.refreshWithTenantResolution(req, res, request);
  }

  /**
   * Logs out current user.
   * @param req - Request object.
   * @param res - Response object.
   * @param request - HTTP request.
   * @param userId - Optional user ID.
   * @returns Success message.
   */
  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Request() request,
    @Body('userId') userId?: string
  ): Promise<{ message: string }> {
    return this.authService.logoutWithTenantResolution(req, res, userId, request);
  }

  /**
   * Gets the current user's profile.
   * @param request - HTTP request containing authenticated user.
   * @returns User profile data.
   */
  @Get('profile')
  async getProfile(@Request() request): Promise<any> {
    const payload = request.user as JwtPayload;
    const user = await this.authService.validatePayload(payload);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles,
      active: user.active,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }
}

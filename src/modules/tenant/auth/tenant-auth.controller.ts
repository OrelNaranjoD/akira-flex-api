import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  Get,
  ForbiddenException,
  Req,
  Res,
} from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { RequireTenantPermission } from './tenant-permissions/decorators/tenant-permissions.decorator';
import { PlatformRole, TenantPermission } from '../../../core/shared/definitions';
import { TenantService } from '../../platform/tenants/services/tenant.service';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Public } from '../../../core/decorators/public.decorator';

/**
 * Controller for tenant authentication operations.
 * @class TenantAuthController
 * @description /auth/tenant/:Roles:Id.
 */
@Controller('/tenant/auth')
export class TenantAuthController {
  constructor(
    private readonly authService: TenantAuthService,
    private readonly tenantService: TenantService
  ) {}

  /**
   * Authenticates a tenant user (can use subdomain resolution).
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @param {Request} request - HTTP request.
   * @param {Response} res - Response object to set refresh cookie.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /login.
   */
  @Public()
  @Post('login')
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Request() request,
    @Res({ passthrough: true }) res: ExpressResponse
  ): Promise<TokenResponseDto> {
    let tenant = request['tenant'];

    if (!tenant || !tenant.id) {
      if (request.headers['x-tenant-id']) {
        tenant = await this.tenantService.findOneInternal(request.headers['x-tenant-id'] as string);
      } else if (request.headers['x-tenant-subdomain']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.headers['x-tenant-subdomain'] as string
        );
      } else if (request.query['tenantId']) {
        tenant = await this.tenantService.findOneInternal(request.query['tenantId'] as string);
      } else if (request.query['tenant']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.query['tenant'] as string
        );
      }
    }

    if (!tenant || !tenant.id) {
      throw new ForbiddenException('Tenant not found or invalid');
    }

    const { tokenResponse, refreshToken } = await this.authService.login(
      String(tenant.id),
      loginRequestDto
    );

    if (refreshToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
        path: '/',
        maxAge: 604800000, // 7 days
      };
      res.cookie('refresh_token', refreshToken, cookieOptions);
    }

    return tokenResponse;
  }

  /**
   * Registers a new tenant user (admin only).
   * @param {string} tenantId - ID of the tenant.
   * @param {RegisterDto} registerDto - User registration data.
   * @param {Request} request - HTTP request.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ForbiddenException} If the authenticated user tries to create users in other tenants.
   * @description POST /register.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post('register')
  async register(
    @Param('tenantId') tenantId: string,
    @Body() registerDto: RegisterDto,
    @Request() request
  ): Promise<TokenResponseDto> {
    const userTenantId = request.user.tenantId;
    const userRoles = request.user.roles || [];

    if (!userRoles.includes(PlatformRole.SUPER_ADMIN) && userTenantId !== tenantId) {
      throw new ForbiddenException('Cannot create users in other tenants');
    }

    return this.authService.register(tenantId, registerDto);
  }

  /**
   * Debug endpoint to list users in a tenant (temporary for debugging).
   * @param {string} tenantId - ID of the tenant.
   * @returns {Promise<any[]>} List of users.
   */
  @Get('debug-users/:tenantId')
  async debugUsers(@Param('tenantId') tenantId: string): Promise<any[]> {
    return this.authService.debugFindUsers(tenantId);
  }

  /**
   * Refreshes authentication tokens using a valid refresh token.
   * @param {Request} req - Request object to read refresh cookie.
   * @param {Response} res - Response object to set rotated refresh cookie.
   * @param {Request} request - HTTP request for tenant resolution.
   * @returns {Promise<TokenResponseDto>} New authentication tokens.
   * @description POST /refresh-token.
   */
  @Post('refresh-token')
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Request() request
  ): Promise<TokenResponseDto> {
    let tenant = request['tenant'];

    if (!tenant || !tenant.id) {
      if (request.headers['x-tenant-id']) {
        tenant = await this.tenantService.findOneInternal(request.headers['x-tenant-id'] as string);
      } else if (request.headers['x-tenant-subdomain']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.headers['x-tenant-subdomain'] as string
        );
      } else if (request.query['tenantId']) {
        tenant = await this.tenantService.findOneInternal(request.query['tenantId'] as string);
      } else if (request.query['tenant']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.query['tenant'] as string
        );
      }
    }

    if (!tenant || !tenant.id) {
      throw new ForbiddenException('Tenant not found or invalid');
    }

    return this.authService.refreshWithCookie(req, res, String(tenant.id));
  }

  /**
   * Logout user by invalidating the refresh token.
   * @param {Request} req - Request object to read refresh cookie.
   * @param {Response} res - Response object to clear cookie.
   * @param {Request} request - HTTP request for tenant resolution.
   * @param {string} [userId] - Optional user id to force logout (admin action).
   * @returns {Promise<{ message: string }>} Logout confirmation message.
   * @description POST /logout.
   */
  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Request() request,
    @Body('userId') userId?: string
  ): Promise<{ message: string }> {
    let tenant = request['tenant'];

    if (!tenant || !tenant.id) {
      if (request.headers['x-tenant-id']) {
        tenant = await this.tenantService.findOneInternal(request.headers['x-tenant-id'] as string);
      } else if (request.headers['x-tenant-subdomain']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.headers['x-tenant-subdomain'] as string
        );
      } else if (request.query['tenantId']) {
        tenant = await this.tenantService.findOneInternal(request.query['tenantId'] as string);
      } else if (request.query['tenant']) {
        tenant = await this.tenantService.findBySubdomainInternal(
          request.query['tenant'] as string
        );
      }
    }

    if (!tenant || !tenant.id) {
      throw new ForbiddenException('Tenant not found or invalid');
    }

    return this.authService.logoutFromRequest(req, res, userId, String(tenant.id));
  }
}

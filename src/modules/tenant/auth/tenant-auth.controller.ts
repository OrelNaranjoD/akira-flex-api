import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { TenantAuthGuard } from './guards/tenant-auth.guard';
import { TenantPermissionGuard } from './tenant-permissions/guards/tenant-permission.guard';
import { RequireTenantPermission } from './tenant-permissions/decorators/tenant-permissions.decorator';
import { TenantPermission } from '../../../core/shared/definitions';
import { PlatformRole } from '../../../core/shared/definitions';

/**
 * Controller for tenant authentication operations.
 * @class TenantAuthController
 * @description /auth/tenant/:Roles:Id.
 */
@Controller('/tenant/auth/:tenantId')
export class TenantAuthController {
  /**
   * Creates an instance of TenantAuthController.
   * @param {TenantAuthService} authService - Tenant authentication service.
   */
  constructor(private readonly authService: TenantAuthService) {}

  /**
   * Authenticates a tenant user.
   * @param {string} tenantId - ID of the tenant.
   * @param {LoginRequestDto} loginRequestDto - User login credentials.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @description POST /login.
   */
  @Post('login')
  async login(
    @Param('tenantId') tenantId: string,
    @Body() loginRequestDto: LoginRequestDto
  ): Promise<TokenResponseDto> {
    return this.authService.login(tenantId, loginRequestDto);
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
  @Post('register')
  @UseGuards(TenantAuthGuard, TenantPermissionGuard)
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  async register(
    @Param('tenantId') tenantId: string,
    @Body() registerDto: RegisterDto,
    @Request() request
  ): Promise<TokenResponseDto> {
    const userTenantId = request.user.tenantId;
    const userRoles = request.user.roles || [];

    // Allow SUPER_ADMIN to create users in any tenant
    // For tenant admins, only allow creating users in their own tenant
    if (!userRoles.includes(PlatformRole.SUPER_ADMIN) && userTenantId !== tenantId) {
      throw new ForbiddenException('Cannot create users in other tenants');
    }

    return this.authService.register(tenantId, registerDto);
  }

  /**
   * Creates the first admin user for a tenant (SUPER_ADMIN only).
   * @param {string} tenantId - ID of the tenant.
   * @param {RegisterDto} registerDto - User registration data.
   * @param {Request} request - HTTP request.
   * @returns {Promise<TokenResponseDto>} Authentication tokens.
   * @throws {ForbiddenException} If not SUPER_ADMIN or admin already exists.
   * @description POST /create-admin.
   */
  @Post('create-admin')
  @UseGuards(TenantAuthGuard)
  async createTenantAdmin(
    @Param('tenantId') tenantId: string,
    @Body() registerDto: RegisterDto,
    @Request() request
  ): Promise<TokenResponseDto> {
    const userRoles = request.user.roles || [];

    // Only SUPER_ADMIN can create tenant admins
    if (!userRoles.includes(PlatformRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Only SUPER_ADMIN can create tenant administrators');
    }

    return this.authService.createTenantAdmin(tenantId, registerDto);
  }
}

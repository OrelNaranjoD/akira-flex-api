import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TenantJwtAuthGuard } from './guards/tenant-jwt-auth.guard';
import { RolesGuard } from '../../platform/roles/guards/roles.guard';
import { Roles } from '../../platform/roles/decorators/roles.decorator';
import { UserRoles } from '@orelnaranjod/flex-shared-lib';
import { TenantAuthService } from './tenant-auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { RegisterDto } from './dtos/register.dto';

/**
 * Controller for tenant authentication operations.
 * @class TenantAuthController
 * @description /auth/tenant/:Roles:Id.
 */
@Controller('auth/tenant/:tenantId')
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
  @HttpCode(HttpStatus.OK)
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
   * @description POST /register
   * Roles: admin, super_admin.
   */
  @Post('register')
  @UseGuards(TenantJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
  async register(
    @Param('tenantId') tenantId: string,
    @Body() registerDto: RegisterDto,
    @Request() request
  ): Promise<TokenResponseDto> {
    // Verify that the authenticated user belongs to the same tenant
    const userTenantId = request.user.tenantId;
    if (userTenantId !== tenantId) {
      throw new ForbiddenException('Cannot create users in other tenants');
    }

    return this.authService.register(tenantId, registerDto);
  }
}

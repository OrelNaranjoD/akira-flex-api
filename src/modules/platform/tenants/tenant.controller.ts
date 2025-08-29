import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantResponseDto } from './dtos/tenant-response.dto';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';
import { TenantJwtAuthGuard } from '../../tenant/auth/guards/tenant-jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { UserRoles } from '@orelnaranjod/flex-shared-lib';
import { TenantAuthService } from '../../tenant/auth/tenant-auth.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { TokenResponseDto } from '../auth/dtos/token-response.dto';

/**
 * Controller for handling tenant management operations.
 * @class TenantController
 * @description /tenants.
 */
@Controller('tenants')
export class TenantController {
  /**
   * Creates an instance of TenantController.
   * @param {TenantService} tenantService - Service for tenant operations.
   * @param {TenantAuthService} tenantAuthService - Tenant authentication service.
   */
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantAuthService: TenantAuthService
  ) {}

  // ==================== TENANT MANAGEMENT (PLATFORM ADMINS) ====================

  /**
   * Creates a new tenant (platform admin only).
   * @param {CreateTenantDto} createTenantDto - Data for creating a tenant.
   * @returns {Promise<TenantResponseDto>} The created tenant.
   * @description POST /.
   * Roles: super_admin, admin.
   */
  @Post()
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN, UserRoles.ADMIN)
  async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantService.create(createTenantDto);
  }

  /**
   * Retrieves all tenants (platform admin only).
   * @returns {Promise<TenantResponseDto[]>} List of all tenants.
   * @description GET /.
   * Roles: super_admin, admin.
   */
  @Get()
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN)
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantService.findAll();
  }

  /**
   * Retrieves a specific tenant by ID (platform admin only).
   * @param {string}  tenantId - ID of the tenant to retrieve.
   * @returns {Promise<TenantResponseDto>} The requested tenant.
   * @description GET /:tenantId.
   * Roles: super_admin, admin.
   */
  @Get(':tenantId')
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN, UserRoles.USER)
  async findOne(@Param('tenantId') tenantId: string): Promise<TenantResponseDto> {
    return this.tenantService.findOne(tenantId);
  }

  /**
   * Updates a specific tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to update.
   * @param {UpdateTenantDto} updateTenantDto - Data for updating the tenant.
   * @returns {Promise<TenantResponseDto>} The updated tenant.
   * @description PATCH /:tenantId.
   * Roles: super_admin, admin.
   */
  @Patch(':tenantId')
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN, UserRoles.ADMIN)
  async update(
    @Param('tenantId') tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(tenantId, updateTenantDto);
  }

  /**
   * Deactivates a tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to deactivate.
   * @returns {Promise<void>}
   * @description DELETE /:tenantId.
   * Roles: super_admin, admin.
   */
  @Delete(':tenantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PlatformJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SUPER_ADMIN)
  async remove(@Param('tenantId') tenantId: string): Promise<void> {
    return this.tenantService.remove(tenantId);
  }

  // ==================== TENANT USER MANAGEMENT (TENANT ADMINS) ====================

  /**
   * Creates a new user in a specific tenant (tenant admin only).
   * @param {string} id - ID of the tenant.
   * @param {RegisterDto} registerDto - User registration data.
   * @param {Request} request - HTTP request.
   * @returns {Promise<TokenResponseDto>} Authentication tokens for the new user.
   * @description POST /:id/users.
   * Roles: admin, super_admin.
   */
  @Post(':id/users')
  @UseGuards(TenantJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
  async createUser(
    @Param('id') id: string,
    @Body() registerDto: RegisterDto,
    @Request() request
  ): Promise<TokenResponseDto> {
    // Verify that the authenticated user belongs to the same tenant
    const userTenantId = request.user.tenantId;
    if (userTenantId !== parseInt(id, 10)) {
      throw new ForbiddenException('Cannot create users in other tenants');
    }

    return this.tenantAuthService.register(id, registerDto);
  }

  /**
   * Retrieves all users for a specific tenant (tenant admin only).
   * @param {string} id - ID of the tenant.
   * @param {Request} request - HTTP request.
   * @returns {Promise<any[]>} List of users in the tenant.
   * @description GET /:id/users.
   * Roles: admin, super_admin.
   */
  @Get(':id/users')
  @UseGuards(TenantJwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
  async findUsers(@Param('id') id: string, @Request() request): Promise<any[]> {
    // Verify that the authenticated user belongs to the same tenant
    const userTenantId = request.user.tenantId;
    if (userTenantId !== parseInt(id, 10)) {
      throw new ForbiddenException('Cannot access users from other tenants');
    }

    return this.tenantAuthService.findUsers(id);
  }
}

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
} from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantResponseDto } from './dtos/tenant-response.dto';
import { TenantAuthService } from '../../tenant/auth/tenant-auth.service';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { RequirePlatformPermission } from '../auth/platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermissionGuard } from '../auth/platform-permissions/guards/platform-permission.guard';
import { PlatformPermission } from '@shared';

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

  /**
   * Creates a new tenant (platform admin only).
   * @param {CreateTenantDto} createTenantDto - Data for creating a tenant.
   * @returns {Promise<TenantResponseDto>} The created tenant.
   * @description POST /.
   * Roles: super_admin, admin.
   */
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_CREATE)
  @Post()
  async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantService.create(createTenantDto);
  }

  /**
   * Retrieves all tenants (platform admin only).
   * @returns {Promise<TenantResponseDto[]>} List of all tenants.
   * @description GET /.
   * Roles: super_admin, admin.
   */
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW_ALL)
  @Get()
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
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW)
  @Get(':tenantId')
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
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_UPDATE)
  @Patch(':tenantId')
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
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_DISABLE)
  @Delete(':tenantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('tenantId') tenantId: string): Promise<void> {
    return this.tenantService.remove(tenantId);
  }

  /**
   * Restores a previously deactivated tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to restore.
   * @returns {Promise<void>}
   * @description PATCH /:tenantId/restore.
   * Roles: super_admin, admin.
   */
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.TENANT_RESTORE)
  @Patch(':tenantId/restore')
  async restore(@Param('tenantId') tenantId: string): Promise<void> {
    return this.tenantService.restore(tenantId);
  }
}

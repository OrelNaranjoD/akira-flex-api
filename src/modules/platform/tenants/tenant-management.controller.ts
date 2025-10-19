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
} from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantResponseDto } from './dtos/tenant-response.dto';
import { RequirePlatformPermission } from '../auth/platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../core/shared/definitions';
import { Public } from '../../../core/decorators/public.decorator';

/**
 * Controller for handling tenant management operations.
 * @class TenantManagementController
 * @description /tenants.
 */
@Controller('tenants')
export class TenantManagementController {
  /**
   * Creates an instance of TenantManagementController.
   * @param {TenantService} tenantService - Service for tenant operations.
   */
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Creates a new tenant (platform admin only).
   * @param {CreateTenantDto} createTenantDto - Data for creating a tenant.
   * @returns {Promise<TenantResponseDto>} The created tenant.
   * @description POST /.
   * Roles: super_admin, admin.
   */
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
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW_ALL)
  @Get()
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantService.findAll();
  }

  /**
   * Debug endpoint to list all tenants (temporary for debugging).
   * @returns {Promise<any[]>} List of all tenants with details.
   */
  @Public()
  @Get('debug')
  async debug(): Promise<any[]> {
    const tenants = await this.tenantService['tenantRepository'].find();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      schemaName: tenant.schemaName,
      active: tenant.active,
    }));
  }

  /**
   * Updates a specific tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to update.
   * @param {UpdateTenantDto} updateTenantDto - Data for updating the tenant.
   * @returns {Promise<TenantResponseDto>} The updated tenant.
   * @description PATCH /:tenantId.
   * Roles: super_admin, admin.
   */
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
  @RequirePlatformPermission(PlatformPermission.TENANT_RESTORE)
  @Patch(':tenantId/restore')
  async restore(@Param('tenantId') tenantId: string): Promise<void> {
    return this.tenantService.restore(tenantId);
  }
}

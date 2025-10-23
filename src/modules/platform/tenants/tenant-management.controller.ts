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
  Query,
} from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantResponseDto } from './dtos/tenant-response.dto';
import { TenantFiltersDto } from './dtos/tenant-filters.dto';
import { TenantListResponseDto } from './dtos/tenant-list-response.dto';
import { RequirePlatformPermission } from '../auth/platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../core/shared/definitions';
import { Public } from '../../../core/decorators/public.decorator';
import { ApproveTenantRequestDto } from './dtos/approve-tenant-request.dto';
import { TenantRequestDto } from './dtos/tenant-request.dto';
import { PlatformUserService } from '../auth/platform-users/platform-user.service';
import { TenantRequestStatus } from '../auth/platform-users/entities/platform-user.entity';

/**
 * Controller for handling tenant management operations.
 * @class TenantManagementController
 * @description /tenants.
 */
@Controller('tenants')
export class TenantManagementController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly platformUserService: PlatformUserService
  ) {}

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
   * Retrieves all tenants with optional filters and pagination (platform admin only).
   * @param filters - Optional filters for searching tenants.
   * @param page - Page number (default: 1).
   * @param limit - Number of items per page (default: 10).
   * @returns {Promise<TenantListResponseDto>} Paginated and filtered list of tenants.
   * @description GET /.
   * Roles: super_admin, admin.
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW_ALL)
  @Get()
  async findAll(
    @Query() filters?: TenantFiltersDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<TenantListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.tenantService.findAll(filters, pageNum, limitNum);
  }

  /**
   * Retrieves a specific tenant by ID (platform admin only).
   * @param {string} tenantId - ID of the tenant to retrieve.
   * @returns {Promise<TenantResponseDto>} The requested tenant data.
   * @description GET /:tenantId.
   * Roles: super_admin, admin.
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW)
  @Get(':tenantId')
  async findOne(@Param('tenantId') tenantId: string): Promise<TenantResponseDto> {
    return this.tenantService.findOne(tenantId);
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

  /**
   * Lists all pending tenant creation requests (platform admin only).
   * @returns {Promise<TenantRequestDto[]>} List of pending tenant requests.
   * @description GET /requests/pending.
   * Roles: super_admin, admin.
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_VIEW_ALL)
  @Get('requests/pending')
  async getPendingTenantRequests(): Promise<TenantRequestDto[]> {
    const users = await this.platformUserService['userRepository'].find({
      where: { tenantRequestStatus: TenantRequestStatus.PENDING },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'requestedCompanyName',
        'requestedSubdomain',
        'createdAt',
      ],
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      requestedCompanyName: user.requestedCompanyName,
      requestedSubdomain: user.requestedSubdomain,
      createdAt: user.createdAt,
    }));
  }

  /**
   * Approves a tenant creation request and creates the tenant (platform admin only).
   * @param {ApproveTenantRequestDto} approveDto - Approval data.
   * @returns {Promise<TenantResponseDto>} The created tenant.
   * @description POST /requests/approve.
   * Roles: super_admin, admin.
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_CREATE)
  @Post('requests/approve')
  async approveTenantRequest(
    @Body() approveDto: ApproveTenantRequestDto
  ): Promise<TenantResponseDto> {
    const user = await this.platformUserService.findOne(approveDto.userId);

    if (user.tenantRequestStatus !== TenantRequestStatus.PENDING) {
      throw new Error('User does not have a pending tenant request');
    }

    const tenant = await this.tenantService.create({
      name:
        approveDto.companyName ||
        user.requestedCompanyName ||
        `${user.firstName} ${user.lastName}'s Company`,
      subdomain: approveDto.subdomain || user.requestedSubdomain || user.email.split('@')[0],
      email: user.email,
      phone: user.phone,
    });

    await this.platformUserService.update(user.id, {
      tenantRequestStatus: TenantRequestStatus.APPROVED,
    });

    return tenant;
  }

  /**
   * Rejects a tenant creation request (platform admin only).
   * @param {string} userId - ID of the user whose request is being rejected.
   * @returns {Promise<{message: string}>} Success message.
   * @description POST /requests/:userId/reject.
   * Roles: super_admin, admin.
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_CREATE)
  @Post('requests/:userId/reject')
  async rejectTenantRequest(@Param('userId') userId: string): Promise<{ message: string }> {
    const user = await this.platformUserService.findOne(userId);

    if (user.tenantRequestStatus !== TenantRequestStatus.PENDING) {
      throw new Error('User does not have a pending tenant request');
    }

    await this.platformUserService.update(userId, {
      tenantRequestStatus: TenantRequestStatus.REJECTED,
    });

    return { message: 'Tenant request rejected successfully' };
  }
}

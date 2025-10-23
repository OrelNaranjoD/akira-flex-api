import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';
import { CreatePlatformUserDto } from './dtos/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dtos/update-platform-user.dto';
import { PlatformUserFiltersDto } from './dtos/platform-user-filters.dto';
import { AssociateTenantsDto } from './dtos/associate-tenants.dto';
import { RequirePlatformPermission } from '../platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../../core/shared/definitions';
import { PlatformUser } from './decorators/platform-user.decorator';
import type { JwtPayload } from '@orelnaranjod/flex-shared-lib';
import { ToggleUserStatusDto } from '../../../tenant/auth/users/dtos/user-management.dto';

/**
 * Controller for managing platform users.
 * @class PlatformUserController
 */
@Controller('platform/users')
export class PlatformUserController {
  constructor(private readonly platformUserService: PlatformUserService) {}

  /**
   * Creates a new platform user.
   * @param {CreatePlatformUserDto} createPlatformUserDto - User creation data.
   * @returns {Promise<PlatformUser>} Created user.
   */
  @RequirePlatformPermission(PlatformPermission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPlatformUserDto: CreatePlatformUserDto) {
    return this.platformUserService.createUser(createPlatformUserDto);
  }

  /**
   * Retrieves all platform users with optional filters.
   * @param page - Page number (default: 1).
   * @param limit - Number of items per page (default: 10, max: 100).
   * @param filters - Optional filters to apply to the search.
   * @returns {Promise<PlatformUserListResponseDto>} Paginated list of users.
   */
  @RequirePlatformPermission(PlatformPermission.USER_VIEW_ALL)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: PlatformUserFiltersDto
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.platformUserService.findAll(pageNum, limitNum, filters);
  }

  /**
   * Retrieves the owner information for the current authenticated user.
   * Uses the user id (sub) from the validated JWT payload contained in request.user.
   * @param user JwtPayload injected from the request (token).
   * @returns The owner information of the platform user.
   */
  @RequirePlatformPermission(PlatformPermission.USER_ROLE_VIEW_OWN)
  @Get('owner')
  async getOwnerInfo(@PlatformUser() user: JwtPayload) {
    return this.platformUserService.getOwnerInfo(user.sub);
  }

  /**
   * Retrieves a platform user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<PlatformUser>} Found user.
   */
  @RequirePlatformPermission(PlatformPermission.USER_VIEW)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.platformUserService.findOne(id);
  }

  /**
   * Updates a platform user.
   * @param {string} id - User ID.
   * @param {UpdatePlatformUserDto} updatePlatformUserDto - Update data.
   * @returns {Promise<PlatformUser>} Updated user.
   */
  @RequirePlatformPermission(PlatformPermission.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePlatformUserDto: UpdatePlatformUserDto) {
    return this.platformUserService.update(id, updatePlatformUserDto);
  }

  /**
   * Soft deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.USER_DISABLE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.platformUserService.remove(id);
  }

  /**
   * Restores a soft-deleted platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.USER_RESTORE)
  @Patch(':id/restore')
  async restore(@Param('id') id: string): Promise<void> {
    return this.platformUserService.restore(id);
  }

  /**
   * Toggles user active status.
   * @param id - User ID.
   * @param dto - New status.
   * @returns Updated user.
   */
  @RequirePlatformPermission(PlatformPermission.USER_UPDATE)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() dto: ToggleUserStatusDto): Promise<any> {
    return this.platformUserService.toggleUserStatus(id, dto);
  }

  /**
   * Hard deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.USER_DELETE)
  @Delete(':id/delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.platformUserService.delete(id);
  }

  /**
   * Assign role to user.
   * @param {string} userId - User ID.
   * @param {string} roleId - Role ID.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.USER_ROLE_ASSIGN)
  @Post(':userId/roles/:roleId')
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ): Promise<void> {
    return this.platformUserService.assignRole(userId, roleId);
  }

  /**
   * Associate tenants to a platform user (for admin users).
   * @param {string} userId - User ID.
   * @param {AssociateTenantsDto} associateTenantsDto - Tenant association data.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_UPDATE)
  @Post(':userId/tenants')
  @HttpCode(HttpStatus.NO_CONTENT)
  async associateTenants(
    @Param('userId') userId: string,
    @Body() associateTenantsDto: AssociateTenantsDto
  ): Promise<void> {
    return this.platformUserService.associateTenants(userId, associateTenantsDto.tenantIds);
  }

  /**
   * Dissociate tenants from a platform user.
   * @param {string} userId - User ID.
   * @param {AssociateTenantsDto} associateTenantsDto - Tenant dissociation data.
   * @returns {Promise<void>}
   */
  @RequirePlatformPermission(PlatformPermission.TENANT_UPDATE)
  @Delete(':userId/tenants')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dissociateTenants(
    @Param('userId') userId: string,
    @Body() associateTenantsDto: AssociateTenantsDto
  ): Promise<void> {
    return this.platformUserService.dissociateTenants(userId, associateTenantsDto.tenantIds);
  }

  /**
   * Get all tenants managed by a platform user.
   * @param {string} userId - User ID.
   * @returns {Promise<any[]>} Array of managed tenants.
   */
  @RequirePlatformPermission(PlatformPermission.USER_VIEW)
  @Get(':userId/tenants')
  async getManagedTenants(@Param('userId') userId: string): Promise<any[]> {
    const tenants = await this.platformUserService.getManagedTenants(userId);
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      email: tenant.email,
      active: tenant.active,
    }));
  }
}

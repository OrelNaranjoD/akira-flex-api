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
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { TenantUserService } from './tenant-user.service';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';
import { TenantUserListResponseDto } from './dtos/tenant-user-list-response.dto';
import { TenantUserFiltersDto } from './dtos/tenant-user-filters.dto';
import { TenantOwnerFiltersDto } from './dtos/tenant-owner-filters.dto';
import { TenantOwnerListResponseDto } from './dtos/tenant-owner-list-response.dto';
import {
  UpdateUserRolesDto,
  ToggleUserStatusDto,
  TransferOwnershipDto,
} from './dtos/user-management.dto';
import { RequireTenantPermission } from '../tenant-permissions/decorators/tenant-permissions.decorator';
import { TenantPermission } from '../../../../core/shared/definitions';
import { ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateTenantUserCommand } from './commands/create-tenant-user.command';

/**
 * Controller for managing tenant users.
 * @class TenantUserController
 */
@Controller('tenants/users')
export class TenantUserController {
  constructor(
    private readonly tenantUserService: TenantUserService,
    private readonly commandBus: CommandBus
  ) {}

  /**
   * Creates a new tenant user.
   * @param createUserTenantDto - User information.
   * @returns Created tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserTenantDto: CreateTenantUserDto) {
    return this.commandBus.execute(new CreateTenantUserCommand(createUserTenantDto));
  }

  /**
   * Retrieves all tenant users with pagination and optional filters.
   * @param page - Page number.
   * @param limit - Items per page.
   * @param filters - Optional filters for searching users.
   * @returns Paginated and filtered list of tenant users.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW_ALL)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filters?: TenantUserFiltersDto
  ): Promise<TenantUserListResponseDto> {
    return this.tenantUserService.findAll(page, limit, filters);
  }

  /**
   * Retrieves tenant owners with optional filters and pagination.
   * @param filters - Optional filters for searching owners.
   * @param page - Page number.
   * @param limit - Items per page.
   * @returns Paginated and filtered list of tenant owners.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW_ALL)
  @Get('owners')
  async findOwners(
    @Query() filters?: TenantOwnerFiltersDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ): Promise<TenantOwnerListResponseDto> {
    return this.tenantUserService.findOwners(filters, page, limit);
  }

  /**
   * Retrieves current tenant user's profile.
   * @returns Current user's profile.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW)
  @Get('me')
  async getCurrentUserProfile() {
    return this.tenantUserService.getCurrentUserProfile();
  }

  /**
   * Retrieves a tenant user by ID.
   * @param id - User ID.
   * @returns Tenant user.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantUserService.findOne(id);
  }

  /**
   * Updates a tenant user.
   * @param id - User ID.
   * @param updateUserTenantDto - Updated user information.
   * @returns Updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserTenantDto: UpdateTenantUserDto) {
    return this.tenantUserService.update(id, updateUserTenantDto);
  }

  /**
   * Soft deletes a tenant user.
   * @param id - User ID.
   * @returns Void.
   */
  @RequireTenantPermission(TenantPermission.USER_DISABLE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.remove(id);
  }

  /**
   * Toggles user active status.
   * @param id - User ID.
   * @param dto - New status.
   * @returns Updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() dto: ToggleUserStatusDto): Promise<any> {
    return this.tenantUserService.toggleUserStatus(id, dto);
  }

  /**
   * Updates user roles.
   * @param id - User ID.
   * @param dto - New roles.
   * @returns Updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id/roles')
  async updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto): Promise<any> {
    return this.tenantUserService.updateUserRoles(id, dto);
  }

  /**
   * Assign role to user.
   * @param userId - User ID.
   * @param roleName - Role name to assign.
   * @returns Updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.ROLE_ASSIGN)
  @Post(':userId/roles/:roleName')
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string
  ): Promise<any> {
    return this.tenantUserService.assignRole(userId, roleName);
  }

  /**
   * Transfers ownership to another user.
   * @param dto - Transfer information.
   * @returns Success message.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Post('transfer-ownership')
  async transferOwnership(@Body() dto: TransferOwnershipDto): Promise<{ message: string }> {
    return this.tenantUserService.transferOwnership(dto);
  }

  /**
   * Hard deletes a tenant user.
   * @param id - User ID.
   * @returns Void.
   */
  @RequireTenantPermission(TenantPermission.USER_DISABLE)
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.hardDeleteUser(id);
  }
}

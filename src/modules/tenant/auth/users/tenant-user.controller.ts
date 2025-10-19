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
@Controller('user-tenants')
export class TenantUserController {
  constructor(
    private readonly tenantUserService: TenantUserService,
    private readonly commandBus: CommandBus
  ) {}

  /**
   * Creates a new tenant user.
   * @param createUserTenantDto - The data transfer object containing user information.
   * @returns The created tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserTenantDto: CreateTenantUserDto) {
    return this.commandBus.execute(new CreateTenantUserCommand(createUserTenantDto));
  }

  /**
   * Registers a new tenant user.
   * @param dto - The data transfer object containing registration information.
   * @returns The registered tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto) {
    return this.tenantUserService.registerUser(dto);
  }

  /**
   * Retrieves all tenant users with pagination.
   * @param page - The page number for pagination.
   * @param limit - The number of items per page.
   * @returns A paginated list of tenant users.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW_ALL)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<TenantUserListResponseDto> {
    return this.tenantUserService.findAll(page, limit);
  }

  /**
   * Retrieves the profile of the currently authenticated tenant user.
   * @returns The current tenant user's profile.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW)
  @Get('me')
  async getCurrentUserProfile() {
    return this.tenantUserService.getCurrentUserProfile();
  }

  /**
   * Retrieves a tenant user by ID.
   * @param id - The ID of the tenant user.
   * @returns The tenant user with the specified ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantUserService.findOne(id);
  }

  /**
   * Updates a tenant user.
   * @param id - The ID of the tenant user to update.
   * @param updateUserTenantDto - The data transfer object containing updated user information.
   * @returns The updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserTenantDto: UpdateTenantUserDto) {
    return this.tenantUserService.update(id, updateUserTenantDto);
  }

  /**
   * Soft deletes (deactivates) a tenant user.
   * @param id - The ID of the tenant user to remove.
   * @returns Void.
   */
  @RequireTenantPermission(TenantPermission.USER_DISABLE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.remove(id);
  }

  /**
   * Toggles user active status (enable/disable).
   * @param id - The ID of the tenant user.
   * @param dto - The data transfer object containing the new status.
   * @returns The updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() dto: ToggleUserStatusDto): Promise<any> {
    return this.tenantUserService.toggleUserStatus(id, dto);
  }

  /**
   * Updates user roles.
   * @param id - The ID of the tenant user.
   * @param dto - The data transfer object containing the new roles.
   * @returns The updated tenant user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id/roles')
  async updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto): Promise<any> {
    return this.tenantUserService.updateUserRoles(id, dto);
  }

  /**
   * Transfers ownership to another user.
   * @param dto - The data transfer object containing transfer information.
   * @returns A message indicating the result of the operation.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Post('transfer-ownership')
  async transferOwnership(@Body() dto: TransferOwnershipDto): Promise<{ message: string }> {
    return this.tenantUserService.transferOwnership(dto);
  }

  /**
   * Hard deletes a tenant user (permanent deletion).
   * @param id - The ID of the tenant user to hard delete.
   * @returns Void.
   */
  @RequireTenantPermission(TenantPermission.USER_DISABLE)
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.hardDeleteUser(id);
  }
}

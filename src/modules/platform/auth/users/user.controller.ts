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
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/permissions.decorator';
import { Permission } from '../../../../core/shared/definitions';
import { User } from './decorators/user.decorator';
import type { JwtPayload } from '@orelnaranjod/flex-shared-lib';
import { ToggleUserStatusDto } from '../../../tenant/auth/users/dtos/user-management.dto';
import { UserListResponseDto } from './dtos/user-list-response.dto';
import { UserFiltersDto } from './dtos/user-filters.dto';

/**
 * Controller for managing  users.
 * @class UserController
 */
@UseGuards(PlatformAuthGuard, PermissionGuard)
@Controller('/users')
export class UserController {
  constructor(private readonly UserService: UserService) {}

  /**
   * Creates a new admin user.
   * @param {CreateUserDto} createUserDto - User creation data.
   * @returns {Promise<User>} Created user.
   */
  @RequirePermission(Permission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.UserService.createUser(createUserDto);
  }

  /**
   * Retrieves all  users with optional filters and pagination.
   * @param filters - Optional filters for searching users.
   * @param page - Page number (default: 1).
   * @param limit - Number of items per page (default: 10).
   * @returns Paginated and filtered list of users.
   */
  @RequirePermission(Permission.USER_VIEW_ALL)
  @Get()
  async findAll(
    @Query() filters?: UserFiltersDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<UserListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.UserService.findAll(filters, pageNum, limitNum);
  }

  /**
   * Retrieves the owner information for the current authenticated user.
   * Uses the user id (sub) from the validated JWT payload contained in request.user.
   * @param user JwtPayload injected from the request (token).
   * @returns The owner information of the  user.
   */
  @RequirePermission(Permission.USER_ROLE_VIEW_OWN)
  @Get('owner')
  async getOwnerInfo(@User() user: JwtPayload) {
    return this.UserService.getOwnerInfo(user.sub);
  }

  /**
   * Retrieves a  user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<User>} Found user.
   */
  @RequirePermission(Permission.USER_VIEW)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.UserService.findOne(id);
  }

  /**
   * Updates a  user.
   * @param {string} id - User ID.
   * @param {UpdateUserDto} updateUserDto - Update data.
   * @returns {Promise<User>} Updated user.
   */
  @RequirePermission(Permission.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.UserService.update(id, updateUserDto);
  }

  /**
   * Soft deletes a  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePermission(Permission.USER_DISABLE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.UserService.remove(id);
  }

  /**
   * Restores a soft-deleted  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePermission(Permission.USER_RESTORE)
  @Patch(':id/restore')
  async restore(@Param('id') id: string): Promise<void> {
    return this.UserService.restore(id);
  }

  /**
   * Toggles user active status.
   * @param id - User ID.
   * @param dto - New status.
   * @returns Updated user.
   */
  @RequirePermission(Permission.USER_UPDATE)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() dto: ToggleUserStatusDto): Promise<any> {
    return this.UserService.toggleUserStatus(id, dto);
  }

  /**
   * Hard deletes a  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequirePermission(Permission.USER_DELETE)
  @Delete(':id/delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.UserService.delete(id);
  }

  /**
   * Assign role to user.
   * @param {string} userId - User ID.
   * @param {string} roleId - Role ID.
   * @returns {Promise<void>}
   */
  @RequirePermission(Permission.USER_ROLE_ASSIGN)
  @Post(':userId/roles/:roleId')
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ): Promise<void> {
    return this.UserService.assignRole(userId, roleId);
  }
}

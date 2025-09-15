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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/permissions.decorator';
import { Permission } from '../../../../core/definitions/definitions';
import { User } from './decorators/user.decorator';
import type { JwtPayload } from '@orelnaranjod/flex-shared-lib';
import { Public } from '../../../../core/decorators/public.decorator';

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
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.UserService.createUser(createUserDto);
  }

  /**
   * Retrieves all  users.
   * @returns {Promise<User[]>} List of users.
   */
  @RequirePermission(Permission.USER_VIEW_ALL)
  @Get()
  async findAll() {
    return this.UserService.findAll();
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
    // JwtPayload.sub contains the user id (UUID) per token generation.
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

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
import { PlatformUserService } from './platform-user.service';
import { CreatePlatformUserDto } from './dtos/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dtos/update-platform-user.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionGuard } from '../platform-permissions/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../../core/shared/definitions';
import { PlatformUser } from './decorators/platform-user.decorator';
import type { JwtPayload } from '@orelnaranjod/flex-shared-lib';

/**
 * Controller for managing platform users.
 * @class PlatformUserController
 */
@UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
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
   * Retrieves all platform users.
   * @returns {Promise<PlatformUser[]>} List of users.
   */
  @RequirePlatformPermission(PlatformPermission.USER_VIEW_ALL)
  @Get()
  async findAll() {
    return this.platformUserService.findAll();
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
    // JwtPayload.sub contains the user id (UUID) per token generation.
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
}

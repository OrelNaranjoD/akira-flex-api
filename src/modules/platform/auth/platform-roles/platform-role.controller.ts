import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { PlatformRoleService } from './platform-role.service';
import { RequirePlatformPermission } from '../platform-permissions/decorators/platform-permissions.decorator';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionGuard } from '../platform-permissions/guards/platform-permission.guard';
import { CreatePlatformRoleDto } from './dtos/create-platform-role.dto';
import { UpdatePlatformRoleDto } from './dtos/update-platform-role.dto';
import { PlatformPermission } from '@shared';

/**
 * Controller for managing platform-level roles and permissions.
 */
@Controller('platform/roles')
@UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
export class PlatformRoleController {
  constructor(private readonly service: PlatformRoleService) {}

  /**
   * Creates a new platform role.
   * @param dto Data for creating the platform role.
   * @returns The created platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_CREATE)
  @Post()
  create(@Body() dto: CreatePlatformRoleDto) {
    return this.service.create(dto);
  }

  /**
   * Returns all platform roles.
   * @returns Array of platform roles.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_VIEW_ALL)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * Returns a platform role by id.
   * @param id Role identifier.
   * @returns The found platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Updates a platform role.
   * @param id Role identifier.
   * @param dto Data for updating the platform role.
   * @returns The updated platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_UPDATE)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformRoleDto) {
    return this.service.update(id, dto);
  }

  /**
   * Disable a platform role.
   * @param id Role identifier.
   * @returns The disabled platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_DISABLE)
  @Put(':id/disable')
  disable(@Param('id') id: string) {
    return this.service.disable(id);
  }

  /**
   * Restores a platform role.
   * @param id Role identifier.
   * @returns The restored platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_RESTORE)
  @Put(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  /**
   * Removes a platform role.
   * @param id Role identifier.
   * @returns The removed platform role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

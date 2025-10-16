import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { RequirePlatformPermission } from '../platform-permissions/decorators/platform-permissions.decorator';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionGuard } from '../platform-permissions/guards/platform-permission.guard';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { PlatformPermission } from '../../../../core/shared/definitions';

/**
 * Controller for managing -level roles and permissions.
 */
@Controller('/roles')
@UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
export class RoleController {
  constructor(private readonly service: RoleService) {}

  /**
   * Creates a new  role.
   * @param dto Data for creating the  role.
   * @returns The created  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_CREATE)
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  /**
   * Returns all  roles.
   * @returns Array of  roles.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_VIEW_ALL)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * Returns a  role by id.
   * @param id Role identifier.
   * @returns The found  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Updates a  role.
   * @param id Role identifier.
   * @param dto Data for updating the  role.
   * @returns The updated  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_UPDATE)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  /**
   * Disable a  role.
   * @param id Role identifier.
   * @returns The disabled  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_DISABLE)
  @Put(':id/disable')
  disable(@Param('id') id: string) {
    return this.service.disable(id);
  }

  /**
   * Restores a  role.
   * @param id Role identifier.
   * @returns The restored  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_RESTORE)
  @Put(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  /**
   * Removes a  role.
   * @param id Role identifier.
   * @returns The removed  role.
   */
  @RequirePlatformPermission(PlatformPermission.ROLE_DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

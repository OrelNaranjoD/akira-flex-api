import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionGuard } from './guards/permission.guard';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { RequirePermission } from './decorators/permissions.decorator';
import { Permission } from '../../../../core/shared/definitions';

/**
 * Controller for platform permissions management.
 */
@Controller('permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  /**
   * Create a new  permission.
   * @param dto Data to create the permission.
   * @returns Created permission entity.
   */
  @Post()
  @UseGuards(PlatformAuthGuard, PermissionGuard)
  @RequirePermission(Permission.PERMISSION_CREATE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePermissionDto) {
    return this.service.create(dto);
  }

  /**
   * Retrieve all  permissions.
   * @returns Array of permission entities.
   */
  @Get()
  @UseGuards(PlatformAuthGuard, PermissionGuard)
  @RequirePermission(Permission.PERMISSION_VIEW_ALL)
  findAll() {
    return this.service.findAll();
  }

  /**
   * Retrieve a permission by id.
   * @param id Permission identifier.
   * @returns Permission entity.
   */
  @Get(':id')
  @UseGuards(PlatformAuthGuard, PermissionGuard)
  @RequirePermission(Permission.PERMISSION_VIEW)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Update a permission by id.
   * @param id Permission identifier.
   * @param dto Update data.
   * @returns Updated permission entity.
   */
  @Put(':id')
  @UseGuards(PlatformAuthGuard, PermissionGuard)
  @RequirePermission(Permission.PERMISSION_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.service.update(id, dto);
  }

  /**
   * Remove a permission by id.
   * @param id Permission identifier.
   * @returns Removed permission entity.
   */
  @Delete(':id')
  @UseGuards(PlatformAuthGuard, PermissionGuard)
  @RequirePermission(Permission.PERMISSION_DELETE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

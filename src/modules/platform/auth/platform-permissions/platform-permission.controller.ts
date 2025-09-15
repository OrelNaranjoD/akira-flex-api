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
import { PlatformPermissionService } from './platform-permission.service';
import { CreatePlatformPermissionDto } from './dtos/create-platform-permission.dto';
import { UpdatePlatformPermissionDto } from './dtos/update-platform-permission.dto';
import { PlatformPermissionGuard } from '../platform-permissions/guards/platform-permission.guard';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { RequirePlatformPermission } from '../platform-permissions/decorators/platform-permissions.decorator';
import { PlatformPermission } from '../../../../core/definitions/definitions';

/**
 * Controller for platform permissions management.
 */
@Controller('platforms/permissions')
export class PlatformPermissionController {
  constructor(private readonly service: PlatformPermissionService) {}

  /**
   * Create a new platform permission.
   * @param dto Data to create the permission.
   * @returns Created permission entity.
   */
  @Post()
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.PERMISSION_CREATE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePlatformPermissionDto) {
    return this.service.create(dto);
  }

  /**
   * Retrieve all platform permissions.
   * @returns Array of permission entities.
   */
  @Get()
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.PERMISSION_VIEW_ALL)
  findAll() {
    return this.service.findAll();
  }

  /**
   * Retrieve a permission by id.
   * @param id Permission identifier.
   * @returns Permission entity.
   */
  @Get(':id')
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.PERMISSION_VIEW)
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
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.PERMISSION_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdatePlatformPermissionDto) {
    return this.service.update(id, dto);
  }

  /**
   * Remove a permission by id.
   * @param id Permission identifier.
   * @returns Removed permission entity.
   */
  @Delete(':id')
  @UseGuards(PlatformAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission(PlatformPermission.PERMISSION_DELETE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

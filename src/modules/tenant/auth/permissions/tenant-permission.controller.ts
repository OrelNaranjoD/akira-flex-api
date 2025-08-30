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
} from '@nestjs/common';
import { PlatformPermissionService } from './tenant-permission.service';
import { CreatePlatformPermissionDto } from './dtos/create-tenant-permission.dto';
import { UpdatePlatformPermissionDto } from './dtos/update-tenant-permission.dto';

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
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePlatformPermissionDto) {
    return this.service.create(dto);
  }

  /**
   * Retrieve all platform permissions.
   * @returns Array of permission entities.
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * Retrieve a permission by id.
   * @param id Permission identifier.
   * @returns Permission entity.
   */
  @Get(':id')
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
  update(@Param('id') id: string, @Body() dto: UpdatePlatformPermissionDto) {
    return this.service.update(id, dto);
  }

  /**
   * Remove a permission by id.
   * @param id Permission identifier.
   * @returns Removed permission entity.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

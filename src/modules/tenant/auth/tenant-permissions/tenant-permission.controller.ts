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
import { TenantPermissionService } from './tenant-permission.service';
import { CreateTenantPermissionDto } from './dtos/create-tenant-permission.dto';
import { UpdateTenantPermissionDto } from './dtos/update-tenant-permission.dto';

/**
 * Controller for tenant permissions management.
 */
@Controller('tenants/permissions')
export class TenantPermissionController {
  constructor(private readonly service: TenantPermissionService) {}

  /**
   * Create a new tenant permission.
   * @param dto Data to create the permission.
   * @returns Created permission entity.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTenantPermissionDto) {
    return this.service.create(dto);
  }

  /**
   * Retrieve all tenant permissions.
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
  update(@Param('id') id: string, @Body() dto: UpdateTenantPermissionDto) {
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

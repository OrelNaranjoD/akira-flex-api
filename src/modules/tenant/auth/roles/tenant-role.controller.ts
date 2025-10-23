import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { TenantRoleService } from './tenant-role.service';
import { CreateTenantRoleDto } from './dtos/create-tenant-role.dto';
import { UpdateTenantRoleDto } from './dtos/update-tenant-role.dto';
import { TenantPermissions } from './decorators/tenant-permissions.decorator';

/**
 * Controller for managing tenant-level roles and permissions.
 */
@Controller('tenants/roles')
export class TenantRolesController {
  constructor(private readonly service: TenantRoleService) {}

  /**
   * Creates a new tenant role.
   * @param dto Data for creating the tenant role.
   * @returns The created tenant role.
   */
  @Post()
  @TenantPermissions('CREATE_TENANT_ROLE')
  create(@Body() dto: CreateTenantRoleDto) {
    return this.service.create(dto);
  }

  /**
   * Returns all tenant roles.
   * @returns Array of tenant roles.
   */
  @Get()
  @TenantPermissions('VIEW_TENANT_ROLES')
  findAll() {
    return this.service.findAll();
  }

  /**
   * Returns a tenant role by id.
   * @param id Role identifier.
   * @returns The found tenant role.
   */
  @Get(':id')
  @TenantPermissions('VIEW_TENANT_ROLES')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Updates a tenant role.
   * @param id Role identifier.
   * @param dto Data for updating the tenant role.
   * @returns The updated tenant role.
   */
  @Put(':id')
  @TenantPermissions('UPDATE_TENANT_ROLE')
  update(@Param('id') id: string, @Body() dto: UpdateTenantRoleDto) {
    return this.service.update(id, dto);
  }

  /**
   * Removes a tenant role.
   * @param id Role identifier.
   * @returns The removed tenant role.
   */
  @Delete(':id')
  @TenantPermissions('DELETE_TENANT_ROLE')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

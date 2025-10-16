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
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { TenantUserService } from './tenant-user.service';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';
import { TenantAuthGuard } from '../guards/tenant-auth.guard';
import { TenantPermissionGuard } from '../tenant-permissions/guards/tenant-permission.guard';
import { RequireTenantPermission } from '../tenant-permissions/decorators/tenant-permissions.decorator';
import { TenantPermission } from '../../../../core/shared/definitions';

/**
 * Controller for managing tenant users.
 * @class TenantUserService
 */
@UseGuards(TenantAuthGuard, TenantPermissionGuard)
@Controller('user-tenants')
export class TenantUserController {
  constructor(private readonly tenantUserService: TenantUserService) {}

  /**
   * Creates a new tenant user.
   * @param {CreateUserTenantDto} createUserTenantDto - User creation data.
   * @returns {Promise<TenantUser>} Created user.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserTenantDto: CreateTenantUserDto) {
    return this.tenantUserService.createUser(createUserTenantDto);
  }

  /**
   * Registers a new tenant user (paridad con platform).
   * @param {CreateUserTenantDto} dto - User registration data.
   * @returns {Promise<TenantUser>} Registered user.
   */
  @RequireTenantPermission(TenantPermission.USER_CREATE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto) {
    return this.tenantUserService.registerUser(dto);
  }

  /**
   * Retrieves all tenant users.
   * @returns {Promise<TenantUser[]>} List of users.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW_ALL)
  @Get()
  async findAll() {
    return this.tenantUserService.findAll();
  }

  /**
   * Retrieves a tenant user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<TenantUser>} Found user.
   */
  @RequireTenantPermission(TenantPermission.USER_VIEW)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantUserService.findOne(id);
  }

  /**
   * Updates a tenant user.
   * @param {string} id - User ID.
   * @param {UpdateUserTenantDto} updateUserTenantDto - Update data.
   * @returns {Promise<TenantUser>} Updated user.
   */
  @RequireTenantPermission(TenantPermission.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserTenantDto: UpdateTenantUserDto) {
    return this.tenantUserService.update(id, updateUserTenantDto);
  }

  /**
   * Soft deletes a tenant user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @RequireTenantPermission(TenantPermission.USER_DISABLE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.remove(id);
  }
}

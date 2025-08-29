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
} from '@nestjs/common';
import { UserTenantService } from './user-tenant.service';
import { CreateUserTenantDto } from './dtos/create-user-tenant.dto';
import { UpdateUserTenantDto } from './dtos/update-user-tenant.dto';

/**
 * Controller for managing tenant users.
 * @class UserTenantController
 */
@Controller('user-tenants')
export class UserTenantController {
  constructor(private readonly userTenantService: UserTenantService) {}

  /**
   * Creates a new tenant user.
   * @param {CreateUserTenantDto} createUserTenantDto - User creation data.
   * @returns {Promise<TenantUser>} Created user.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserTenantDto: CreateUserTenantDto) {
    return this.userTenantService.create(createUserTenantDto);
  }

  /**
   * Retrieves all tenant users.
   * @returns {Promise<TenantUser[]>} List of users.
   */
  @Get()
  async findAll() {
    return this.userTenantService.findAll();
  }

  /**
   * Retrieves a tenant user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<TenantUser>} Found user.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userTenantService.findOne(id);
  }

  /**
   * Updates a tenant user.
   * @param {string} id - User ID.
   * @param {UpdateUserTenantDto} updateUserTenantDto - Update data.
   * @returns {Promise<TenantUser>} Updated user.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserTenantDto: UpdateUserTenantDto) {
    return this.userTenantService.update(id, updateUserTenantDto);
  }

  /**
   * Soft deletes a tenant user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.userTenantService.remove(id);
  }
}

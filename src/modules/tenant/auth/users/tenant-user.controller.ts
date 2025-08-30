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
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { TenantUserService } from './tenant-user.service';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';

/**
 * Controller for managing tenant users.
 * @class TenantUserService
 */
@Controller('user-tenants')
export class TenantUserController {
  constructor(private readonly tenantUserService: TenantUserService) {}

  /**
   * Creates a new tenant user.
   * @param {CreateUserTenantDto} createUserTenantDto - User creation data.
   * @returns {Promise<TenantUser>} Created user.
   */
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
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto) {
    return this.tenantUserService.registerUser(dto);
  }

  /**
   * Retrieves all tenant users.
   * @returns {Promise<TenantUser[]>} List of users.
   */
  @Get()
  async findAll() {
    return this.tenantUserService.findAll();
  }

  /**
   * Retrieves a tenant user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<TenantUser>} Found user.
   */
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
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserTenantDto: UpdateTenantUserDto) {
    return this.tenantUserService.update(id, updateUserTenantDto);
  }

  /**
   * Soft deletes a tenant user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantUserService.remove(id);
  }
}

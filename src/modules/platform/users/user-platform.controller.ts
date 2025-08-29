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
import { UserPlatformService } from './user-platform.service';
import { CreateUserPlatformDto } from './dtos/create-user-platform.dto';
import { UpdateUserPlatformDto } from './dtos/update-user-platform.dto';

/**
 * Controller for managing platform users.
 * @class UserPlatformController
 */
@Controller('platforms/users')
export class UserPlatformController {
  constructor(private readonly userPlatformService: UserPlatformService) {}

  /**
   * Creates a new platform user.
   * @param {CreateUserPlatformDto} createUserPlatformDto - User creation data.
   * @returns {Promise<PlatformUser>} Created user.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserPlatformDto: CreateUserPlatformDto) {
    return this.userPlatformService.createUser(createUserPlatformDto);
  }

  /**
   * Retrieves all platform users.
   * @returns {Promise<PlatformUser[]>} List of users.
   */
  @Get()
  async findAll() {
    return this.userPlatformService.findAll();
  }

  /**
   * Retrieves a platform user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<PlatformUser>} Found user.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userPlatformService.findOne(id);
  }

  /**
   * Updates a platform user.
   * @param {string} id - User ID.
   * @param {UpdateUserPlatformDto} updateUserPlatformDto - Update data.
   * @returns {Promise<PlatformUser>} Updated user.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserPlatformDto: UpdateUserPlatformDto) {
    return this.userPlatformService.update(id, updateUserPlatformDto);
  }

  /**
   * Soft deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.userPlatformService.remove(id);
  }
}

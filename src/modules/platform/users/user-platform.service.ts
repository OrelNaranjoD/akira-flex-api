import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlatform } from './user-platform.entity';
import { CreateUserPlatformDto } from './dtos/create-user-platform.dto';
import { UpdateUserPlatformDto } from './dtos/update-user-platform.dto';
import { RegisterDto, UserRoles } from '@orelnaranjod/flex-shared-lib';

/**
 * Service for managing platform users.
 * @class UserPlatformService
 */
@Injectable()
export class UserPlatformService {
  constructor(
    @InjectRepository(UserPlatform)
    private readonly userRepository: Repository<UserPlatform>
  ) {}

  /**
   * Creates a new platform user.
   * @param {CreateUserPlatformDto} dto - User creation data.
   * @returns {Promise<UserPlatform>} Created user.
   */
  async createUser(dto: CreateUserPlatformDto): Promise<UserPlatform> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  /**
   * Register a new platform user.
   * @param {RegisterDto} dto - User registration data.
   * @returns {Promise<UserPlatform>} Registered user.
   */
  async registerUser(dto: RegisterDto): Promise<UserPlatform> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    user.roles = [UserRoles.USER];
    return this.userRepository.save(user);
  }

  /**
   * Retrieves all platform users.
   * @returns {Promise<UserPlatform[]>} List of users.
   */
  async findAll(): Promise<UserPlatform[]> {
    return this.userRepository.find();
  }

  /**
   * Retrieves a platform user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<UserPlatform>} Found user.
   */
  async findOne(id: string): Promise<UserPlatform> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Updates a platform user.
   * @param {string} id - User ID.
   * @param {UpdateUserPlatformDto} dto - Update data.
   * @returns {Promise<UserPlatform>} Updated user.
   */
  async update(id: string, dto: UpdateUserPlatformDto): Promise<UserPlatform> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Soft deletes a platform user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.active = false;
    await this.userRepository.save(user);
  }
}

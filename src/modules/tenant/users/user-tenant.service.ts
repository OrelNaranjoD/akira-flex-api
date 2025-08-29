import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTenant } from './user-tenant.entity';
import { CreateUserTenantDto } from './dtos/create-user-tenant.dto';
import { UpdateUserTenantDto } from './dtos/update-user-tenant.dto';

/**
 * Service for managing user tenants.
 * @class UserTenantService
 */
@Injectable()
export class UserTenantService {
  constructor(
    @InjectRepository(UserTenant)
    private readonly userRepository: Repository<UserTenant>
  ) {}

  /**
   * Creates a new user tenant.
   * @param {CreateUserTenantDto} dto - User tenant creation data.
   * @returns {Promise<UserTenant>} Created user tenant.
   */
  async create(dto: CreateUserTenantDto): Promise<UserTenant> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  /**
   * Retrieves all user tenants.
   * @returns {Promise<UserTenant[]>} List of user tenants.
   */
  async findAll(): Promise<UserTenant[]> {
    return this.userRepository.find();
  }

  /**
   * Retrieves a user tenant by ID.
   * @param {string} id - User tenant ID.
   * @returns {Promise<UserTenant>} Found user tenant.
   */
  async findOne(id: string): Promise<UserTenant> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User tenant not found');
    return user;
  }

  /**
   * Updates a user tenant.
   * @param {string} id - User tenant ID.
   * @param {UpdateUserTenantDto} dto - Update data.
   * @returns {Promise<UserTenant>} Updated user tenant.
   */
  async update(id: string, dto: UpdateUserTenantDto): Promise<UserTenant> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Soft deletes a user tenant.
   * @param {string} id - User tenant ID.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.active = false;
    await this.userRepository.save(user);
  }
}

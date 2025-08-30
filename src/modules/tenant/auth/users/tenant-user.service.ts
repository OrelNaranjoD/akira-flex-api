// ...existing code...
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantUser } from './tenant-user.entity';
import { CreateTenantUserDto } from './dtos/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dtos/update-tenant-user.dto';

/**
 * Service for managing user tenants.
 * @class TenantUserService
 */
@Injectable()
export class TenantUserService {
  constructor(
    @InjectRepository(TenantUser)
    private readonly userRepository: Repository<TenantUser>
  ) {}

  /**
   * Creates a new user tenant.
   * @param {CreateTenantUserDto} dto - User tenant creation data.
   * @returns {Promise<TenantUser>} Created user tenant.
   */
  /**
   * Creates a new tenant user.
   * @param {CreateTenantUserDto} dto - User creation data.
   * @returns {Promise<TenantUser>} Created user.
   */
  async createUser(dto: CreateTenantUserDto): Promise<TenantUser> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  /**
   * Register a new tenant user (optional, for parity with platform).
   * @param {CreateTenantUserDto} dto - User registration data.
   * @returns {Promise<TenantUser>} Registered user.
   */
  async registerUser(dto: CreateTenantUserDto): Promise<TenantUser> {
    // Puedes personalizar la lógica de registro si es necesario
    return this.createUser(dto);
  }

  /**
   * Retrieves all user tenants.
   * @returns {Promise<TenantUser[]>} List of user tenants.
   */
  async findAll(): Promise<TenantUser[]> {
    return this.userRepository.find();
  }

  /**
   * Retrieves a user tenant by ID.
   * @param {string} id - User tenant ID.
   * @returns {Promise<TenantUser>} Found user tenant.
   */
  async findOne(id: string): Promise<TenantUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User tenant not found');
    return user;
  }

  /**
   * Updates a user tenant.
   * @param {string} id - User tenant ID.
   * @param {UpdateTenantUserDto} dto - Update data.
   * @returns {Promise<TenantUser>} Updated user tenant.
   */
  async update(id: string, dto: UpdateTenantUserDto): Promise<TenantUser> {
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

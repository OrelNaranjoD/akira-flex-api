import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Status } from '@definitions';
import { mapUserToResponse } from './mappers/user-response.mapper';

/**
 * Service for managing  users.
 * @class UserService
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  /**
   * Creates a new user.
   * @param {CreateUserDto} dto - User creation data.
   * @returns {Promise<Partial<UserResponseDto>>} Created user.
   */
  async createUser(dto: CreateUserDto): Promise<Partial<UserResponseDto>> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const roleEntities = dto.roles?.length
      ? (
          await Promise.all(
            dto.roles.map((name) => this.roleRepository.findOne({ where: { name } }))
          )
        ).filter((role): role is Role => !!role)
      : [];

    const user = this.userRepository.create({
      ...dto,
      roles: roleEntities,
    });
    const savedUser = await this.userRepository.save(user);

    return mapUserToResponse(savedUser);
  }

  /**
   * Retrieves all  users.
   * @returns {Promise<User[]>} List of users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Retrieves a  user by ID.
   * @param {string} id - User ID.
   * @returns {Promise<User>} Found user.
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Updates a  user.
   * @param {string} id - User ID.
   * @param {UpdateUserDto} dto - Update data.
   * @returns {Promise<User>} Updated user.
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Soft deletes a  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.status = Status.DELETED;
    await this.userRepository.save(user);
  }

  /**
   * Restores a soft-deleted  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async restore(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.status = Status.INACTIVE;
    await this.userRepository.save(user);
  }

  /**
   * Hard deletes a  user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Assign a role to a user.
   * @param {string} userId - User ID.
   * @param {string} roleId - Role ID.
   * @returns {Promise<void>}
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // initialize roles array if missing
    if (!user.roles) user.roles = [] as any;

    // avoid duplicates
    const already = (user.roles as any[]).some((r) => r.id === role.id || r === role.id);
    if (!already) {
      (user.roles as any[]).push(role);
      await this.userRepository.save(user);
    }
  }

  /**
   * Returns owner information for a given user id.
   * Includes basic profile, roles and derived permission codes.
   * @param {string} userId - User id (UUID).
   * @returns Owner info object.
   */
  async getOwnerInfo(userId: string) {
    const user = await this.findOne(userId);
    const roles = (user.roles || []).map((r: any) => ({ id: r.id, name: r.name }));
    const permissions = (user.roles || [])
      .flatMap((r: any) => (r.permissions || []).map((p: any) => p.code))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles,
      permissions,
    };
  }
}

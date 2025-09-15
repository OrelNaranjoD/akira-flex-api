import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformRole } from './entities/platform-role.entity';
import { CreatePlatformRoleDto } from './dtos/create-platform-role.dto';
import { UpdatePlatformRoleDto } from './dtos/update-platform-role.dto';

/**
 * Service for handling platform role operations.
 */
@Injectable()
export class PlatformRoleService {
  constructor(
    @InjectRepository(PlatformRole)
    private readonly repo: Repository<PlatformRole>
  ) {}

  /**
   * Creates a new platform role.
   * @param dto Data for creating the platform role.
   * @returns The created platform role.
   */
  async create(dto: CreatePlatformRoleDto) {
    const { permissions, ...rest } = dto;
    const createData: import('typeorm').DeepPartial<PlatformRole> = {
      ...rest,
      permissions: permissions
        ? permissions.map((permissionId) => ({ id: permissionId }))
        : undefined,
    };
    const role = this.repo.create(createData);
    return this.repo.save(role);
  }

  /**
   * Returns all platform roles.
   * @returns Array of platform roles.
   */
  async findAll() {
    return this.repo.find();
  }

  /**
   * Returns a platform role by id.
   * @param id Role identifier.
   * @returns The found platform role.
   */
  async findOne(id: string) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  /**
   * Updates a platform role.
   * @param id Role identifier.
   * @param dto Data for updating the platform role.
   * @returns The updated platform role.
   */
  async update(id: string, dto: UpdatePlatformRoleDto) {
    const { permissions, ...rest } = dto;
    const updateData: import('typeorm').DeepPartial<PlatformRole> = { ...rest };
    if (permissions) {
      updateData.permissions = permissions.map((permissionId) => ({ id: permissionId }));
    }
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Removes a platform role.
   * @param id Role identifier.
   * @returns The removed platform role.
   */
  async remove(id: string) {
    const role = await this.findOne(id);
    return this.repo.remove(role);
  }

  /**
   * Restores a platform role.
   * @param id Role identifier.
   * @returns The restored platform role.
   */
  async restore(id: string) {
    const role = await this.findOne(id);
    role.active = true;
    return this.repo.save(role);
  }

  /**
   * Disables a platform role.
   * @param id Role identifier.
   * @returns The disabled platform role.
   */
  async disable(id: string) {
    const role = await this.findOne(id);
    role.active = false;
    return this.repo.save(role);
  }
}

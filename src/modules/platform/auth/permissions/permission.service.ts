import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';

/**
 * Service to manage  permissions.
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>
  ) {}

  /**
   * Create a new  permission.
   * @param dto Data to create the permission.
   * @returns Created permission entity.
   */
  async create(dto: CreatePermissionDto) {
    const perm = this.repo.create(dto);
    return this.repo.save(perm);
  }

  /**
   * Retrieve all  permissions.
   * @returns Array of permissions.
   */
  async findAll() {
    return this.repo.find();
  }

  /**
   * Retrieve a single permission by id.
   * @param id Permission id.
   * @returns The permission entity.
   */
  async findOne(id: string) {
    const perm = await this.repo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    return perm;
  }

  /**
   * Update an existing permission.
   * @param id Permission id.
   * @param dto Update data.
   * @returns Updated permission entity.
   */
  async update(id: string, dto: UpdatePermissionDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  /**
   * Remove a permission by id.
   * @param id Permission id.
   * @returns Removed permission entity.
   */
  async remove(id: string) {
    const perm = await this.findOne(id);
    return this.repo.remove(perm);
  }
}

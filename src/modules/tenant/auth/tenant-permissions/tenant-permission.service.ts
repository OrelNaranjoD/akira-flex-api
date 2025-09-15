import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantPermission } from './entities/tenant-permission.entity';
import { CreateTenantPermissionDto } from './dtos/create-tenant-permission.dto';
import { UpdateTenantPermissionDto } from './dtos/update-tenant-permission.dto';

/**
 * Service to manage Tenant permissions.
 */
@Injectable()
export class TenantPermissionService {
  constructor(
    @InjectRepository(TenantPermission)
    private readonly repo: Repository<TenantPermission>
  ) {}

  /**
   * Create a new Tenant permission.
   * @param dto Data to create the permission.
   * @returns Created permission entity.
   */
  async create(dto: CreateTenantPermissionDto) {
    const perm = this.repo.create(dto);
    return this.repo.save(perm);
  }

  /**
   * Retrieve all Tenant permissions.
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
  async update(id: string, dto: UpdateTenantPermissionDto) {
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

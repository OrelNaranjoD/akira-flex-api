import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantRole } from './entities/tenant-role.entity';
import { CreateTenantRoleDto } from './dtos/create-tenant-role.dto';
import { UpdateTenantRoleDto } from './dtos/update-tenant-role.dto';

/**
 * Service for handling tenant role operations.
 */
@Injectable()
export class TenantRoleService {
  constructor(
    @InjectRepository(TenantRole)
    private readonly repo: Repository<TenantRole>
  ) {}

  /**
   * Creates a new tenant role.
   * @param dto Data for creating the tenant role.
   * @returns The created tenant role.
   */
  async create(dto: CreateTenantRoleDto) {
    const role = this.repo.create(dto);
    return this.repo.save(role);
  }

  /**
   * Returns all tenant roles.
   * @returns Array of tenant roles.
   */
  async findAll() {
    return this.repo.find();
  }

  /**
   * Returns a tenant role by id.
   * @param id Role identifier.
   * @returns The found tenant role.
   */
  async findOne(id: string) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  /**
   * Updates a tenant role.
   * @param id Role identifier.
   * @param dto Data for updating the tenant role.
   * @returns The updated tenant role.
   */
  async update(id: string, dto: UpdateTenantRoleDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  /**
   * Removes a tenant role.
   * @param id Role identifier.
   * @returns The removed tenant role.
   */
  async remove(id: string) {
    const role = await this.findOne(id);
    return this.repo.remove(role);
  }
}

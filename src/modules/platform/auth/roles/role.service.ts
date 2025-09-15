import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

/**
 * Service for handling  role operations.
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>
  ) {}

  /**
   * Creates a new  role.
   * @param dto Data for creating the  role.
   * @returns The created  role.
   */
  async create(dto: CreateRoleDto) {
    const { permissions, ...rest } = dto;
    const createData: import('typeorm').DeepPartial<Role> = {
      ...rest,
      permissions: permissions
        ? permissions.map((permissionId) => ({ id: permissionId }))
        : undefined,
    };
    const role = this.repo.create(createData);
    return this.repo.save(role);
  }

  /**
   * Returns all  roles.
   * @returns Array of  roles.
   */
  async findAll() {
    return this.repo.find();
  }

  /**
   * Returns a  role by id.
   * @param id Role identifier.
   * @returns The found  role.
   */
  async findOne(id: string) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  /**
   * Updates a  role.
   * @param id Role identifier.
   * @param dto Data for updating the  role.
   * @returns The updated  role.
   */
  async update(id: string, dto: UpdateRoleDto) {
    const { permissions, ...rest } = dto;
    const updateData: import('typeorm').DeepPartial<Role> = { ...rest };
    if (permissions) {
      updateData.permissions = permissions.map((permissionId) => ({ id: permissionId }));
    }
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Removes a  role.
   * @param id Role identifier.
   * @returns The removed  role.
   */
  async remove(id: string) {
    const role = await this.findOne(id);
    return this.repo.remove(role);
  }

  /**
   * Restores a  role.
   * @param id Role identifier.
   * @returns The restored  role.
   */
  async restore(id: string) {
    const role = await this.findOne(id);
    role.active = true;
    return this.repo.save(role);
  }

  /**
   * Disables a  role.
   * @param id Role identifier.
   * @returns The disabled  role.
   */
  async disable(id: string) {
    const role = await this.findOne(id);
    role.active = false;
    return this.repo.save(role);
  }
}

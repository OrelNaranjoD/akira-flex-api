import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import { TenantResponseDto } from '../dtos/tenant-response.dto';
import { TenantFiltersDto } from '../dtos/tenant-filters.dto';
import { TenantListResponseDto } from '../dtos/tenant-list-response.dto';

/**
 * Service responsible for tenant management operations.
 * @class TenantService
 */
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Creates a new tenant and its dedicated database schema.
   * @param {CreateTenantDto} createTenantDto - Data for creating a new tenant.
   * @returns {Promise<TenantResponseDto>} The created tenant data.
   * @throws {ConflictException} If tenant with same name or subdomain exists.
   * @throws {InternalServerErrorException} If schema creation fails.
   */
  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    const existingTenant = await this.tenantRepository.findOne({
      where: [{ name: createTenantDto.name }, { subdomain: createTenantDto.subdomain }],
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name or subdomain already exists');
    }

    const schemaName = createTenantDto.subdomain.toLowerCase();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        schemaName,
      });

      const savedTenant = await this.tenantRepository.save(tenant);

      if (process.env.NODE_ENV !== 'production') {
        await queryRunner.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      }

      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await this.applyBaseSchemaMigrations(queryRunner, schemaName);

      await queryRunner.commitTransaction();

      return this.mapToResponseDto(savedTenant);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        throw new ConflictException('Tenant with this name or subdomain already exists');
      }

      throw new InternalServerErrorException('Failed to create tenant');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Applies base migrations to a tenant schema.
   * @param {QueryRunner} queryRunner - The query runner instance.
   * @param {string} schemaName - Name of the schema to migrate.
   * @private
   */
  private async applyBaseSchemaMigrations(queryRunner: any, schemaName: string): Promise<void> {
    await queryRunner.query(`SET search_path TO "${schemaName}"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`SET search_path TO public`);
  }

  /**
   * Retrieves all tenants with optional filters and pagination.
   * @param filters - Optional filters to apply.
   * @param page - Page number (1-based, default: 1).
   * @param limit - Number of items per page (default: 10, max: 100).
   * @returns {Promise<TenantListResponseDto>} Paginated and filtered list of tenants.
   */
  async findAll(
    filters?: TenantFiltersDto,
    page: number = 1,
    limit: number = 10
  ): Promise<TenantListResponseDto> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validPage - 1) * validLimit;

    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (filters) {
      if (filters.name) {
        queryBuilder.andWhere('LOWER(tenant.name) LIKE LOWER(:name)', {
          name: `%${filters.name}%`,
        });
      }

      if (filters.subdomain) {
        queryBuilder.andWhere('LOWER(tenant.subdomain) LIKE LOWER(:subdomain)', {
          subdomain: `%${filters.subdomain}%`,
        });
      }

      if (filters.email) {
        queryBuilder.andWhere('LOWER(tenant.email) LIKE LOWER(:email)', {
          email: `%${filters.email}%`,
        });
      }

      if (filters.active !== undefined) {
        queryBuilder.andWhere('tenant.active = :active', { active: filters.active });
      }

      if (filters.createdFrom) {
        queryBuilder.andWhere('tenant.createdAt >= :createdFrom', {
          createdFrom: filters.createdFrom,
        });
      }

      if (filters.createdTo) {
        queryBuilder.andWhere('tenant.createdAt <= :createdTo', {
          createdTo: filters.createdTo,
        });
      }
    }

    queryBuilder.orderBy('tenant.createdAt', 'DESC').skip(skip).take(validLimit);

    const [tenants, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / validLimit);

    return {
      tenants: tenants.map((tenant) => this.mapToResponseDto(tenant)),
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Retrieves a specific tenant by ID.
   * @param {string} id - ID of the tenant to retrieve.
   * @returns {Promise<TenantResponseDto>} The requested tenant data.
   * @throws {NotFoundException} If tenant is not found.
   */
  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return this.mapToResponseDto(tenant);
  }

  /**
   * Retrieves a specific tenant by ID (internal use - returns full entity).
   * @param {string} id - ID of the tenant to retrieve.
   * @returns {Promise<Tenant>} The requested tenant entity.
   * @throws {NotFoundException} If tenant is not found.
   */
  async findOneInternal(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  /**
   * Retrieves multiple tenants by their IDs.
   * @param {string[]} ids - Array of tenant IDs to retrieve.
   * @returns {Promise<Tenant[]>} Array of found tenants.
   */
  async findByIds(ids: string[]): Promise<Tenant[]> {
    return this.tenantRepository.findBy({ id: In(ids) });
  }

  /**
   * Retrieves a tenant by subdomain (internal use - returns full entity).
   * @param {string} subdomain - Subdomain of the tenant to retrieve.
   * @returns {Promise<Tenant>} The requested tenant entity.
   * @throws {NotFoundException} If tenant is not found.
   */
  async findBySubdomainInternal(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }

    return tenant;
  }

  /**
   * Retrieves a tenant by subdomain.
   * @param {string} subdomain - Subdomain of the tenant to retrieve.
   * @returns {Promise<TenantResponseDto>} The requested tenant data.
   * @throws {NotFoundException} If tenant is not found.
   */
  async findBySubdomain(subdomain: string): Promise<TenantResponseDto> {
    const tenant = await this.findBySubdomainInternal(subdomain);
    return this.mapToResponseDto(tenant);
  }

  /**
   * Updates a specific tenant.
   * @param {string} id - ID of the tenant to update.
   * @param {UpdateTenantDto} updateTenantDto - Data for updating the tenant.
   * @returns {Promise<TenantResponseDto>} The updated tenant data.
   * @throws {NotFoundException} If tenant is not found.
   * @throws {ConflictException} If update causes conflict.
   */
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    try {
      const updatedTenant = await this.tenantRepository.save({
        ...tenant,
        ...updateTenantDto,
      });

      return this.mapToResponseDto(updatedTenant);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Tenant with this name or subdomain already exists');
      }
      throw error;
    }
  }

  /**
   * Deactivates a tenant (soft delete).
   * @param {string} id - ID of the tenant to deactivate.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If tenant is not found.
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    await this.tenantRepository.update(id, { active: false });
  }

  /**
   * Restores a previously deactivated tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to restore.
   * @returns {Promise<void>}
   * @description PATCH /:tenantId/restore.
   * Roles: super_admin, admin.
   */
  async restore(tenantId: string): Promise<void> {
    await this.tenantRepository.update(tenantId, { active: true });
  }

  /**
   * Deletes a tenant (platform admin only).
   * @param {string} tenantId - ID of the tenant to delete.
   * @returns {Promise<void>}
   * @description DELETE /:tenantId.
   * Roles: super_admin, admin.
   */
  async delete(tenantId: string): Promise<void> {
    await this.tenantRepository.delete(tenantId);
  }

  /**
   * Maps a Tenant entity to TenantResponseDto.
   * @param {Tenant} tenant - The tenant entity to map.
   * @returns {TenantResponseDto} The mapped response DTO.
   * @private
   */
  private mapToResponseDto(tenant: Tenant): TenantResponseDto {
    const responseDto = new TenantResponseDto();
    responseDto.id = tenant.id;
    responseDto.name = tenant.name;
    responseDto.subdomain = tenant.subdomain;
    responseDto.email = tenant.email;
    responseDto.phone = tenant.phone;
    responseDto.active = tenant.active;
    responseDto.createdAt = tenant.createdAt;
    responseDto.updatedAt = tenant.updatedAt;
    responseDto.subscriptionEnd = tenant.subscriptionEnd;
    responseDto.maxUsers = tenant.maxUsers;
    responseDto.modules = tenant.modules;
    return responseDto;
  }
}

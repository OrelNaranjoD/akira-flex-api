import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import { TenantResponseDto } from '../dtos/tenant-response.dto';

/**
 * Service responsible for tenant management operations.
 * @class TenantService
 */
@Injectable()
export class TenantService {
  /**
   * Creates an instance of TenantService.
   * @param {Repository<Tenant>} tenantRepository - Repository for tenant entities.
   * @param {DataSource} dataSource - Data source for database operations.
   */
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
    // Check if tenant with same name or subdomain already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: [{ name: createTenantDto.name }, { subdomain: createTenantDto.subdomain }],
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name or subdomain already exists');
    }

    // Generate schema name
    const schemaName = `tenant_${createTenantDto.subdomain.toLowerCase()}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the tenant record
      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        schemaName,
      });

      const savedTenant = await this.tenantRepository.save(tenant);

      // Create the dedicated schema
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Apply base tenant migrations (simplified example)
      await this.applyBaseSchemaMigrations(queryRunner, schemaName);

      await queryRunner.commitTransaction();

      return this.mapToResponseDto(savedTenant);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        // Unique violation
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
    // Set search path to the tenant schema
    await queryRunner.query(`SET search_path TO "${schemaName}"`);

    // Create base tables (simplified example)
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

    // Reset search path to default
    await queryRunner.query(`SET search_path TO public`);
  }

  /**
   * Retrieves all tenants.
   * @returns {Promise<TenantResponseDto[]>} List of all tenants.
   */
  async findAll(): Promise<TenantResponseDto[]> {
    const tenants = await this.tenantRepository.find();
    return tenants.map((tenant) => this.mapToResponseDto(tenant));
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
        // Unique violation
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

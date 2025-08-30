import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantService } from '@platform/tenants/services/tenant.service';
import { Tenant } from '@platform/tenants/entities/tenant.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateTenantDto } from '../../../../src/modules/platform/tenants/dtos/update-tenant.dto';
import { CreateTenantDto } from '../../../../src/modules/platform/tenants/dtos/create-tenant.dto';

describe('TenantService', () => {
  let service: TenantService;
  let repo: any;
  let dataSource: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        query: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: repo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should find all tenants', async () => {
    const tenants = [{ id: '1' }];
    repo.find.mockResolvedValue(tenants);
    await expect(service.findAll()).resolves.toEqual(tenants.map((t) => t));
  });

  it('create should throw Conflict when existing tenant found', async () => {
    const dto: CreateTenantDto = { name: 'T', subdomain: 's', email: '' };
    repo.findOne = jest.fn().mockResolvedValue({ id: '1' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('create should succeed and return mapped dto', async () => {
    const dto: CreateTenantDto = { name: 'T', subdomain: 's', email: 'a@b.com' };
    const saved = { id: 't1', ...dto, schemaName: 'tenant_s' };

    repo.findOne = jest.fn().mockResolvedValue(null);
    repo.create = jest.fn().mockReturnValue(dto);
    repo.save = jest.fn().mockResolvedValue(saved);

    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner as any);

    await expect(service.create(dto)).resolves.toMatchObject({ id: 't1', name: 'T' });
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('create should handle unique violation and throw ConflictException', async () => {
    const dto: CreateTenantDto = { name: 'T', subdomain: 's', email: '' };

    repo.findOne = jest.fn().mockResolvedValue(null);
    repo.create = jest.fn().mockReturnValue(dto);
    repo.save = jest.fn();

    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn().mockRejectedValue({ code: '23505' }),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner as any);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('findOne should throw NotFound when missing', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update should throw NotFound when missing', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);
    await expect(service.update('x', {} as UpdateTenantDto)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('update should save and return mapped dto', async () => {
    const existing = { id: 't1', name: 'T' } as any;
    const updated = { ...existing, name: 'T2' };
    repo.findOne = jest.fn().mockResolvedValue(existing);
    repo.save = jest.fn().mockResolvedValue(updated);

    const updateDto: UpdateTenantDto = { name: 'T2' };
    await expect(service.update('t1', updateDto)).resolves.toMatchObject({
      name: 'T2',
    });
  });

  it('remove should throw NotFound when missing', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove should call update when tenant exists', async () => {
    const tenant = { id: 't1' } as any;
    repo.findOne = jest.fn().mockResolvedValue(tenant);
    repo.update = jest.fn().mockResolvedValue(undefined);

    await expect(service.remove('t1')).resolves.toBeUndefined();
    expect(repo.update).toHaveBeenCalledWith('t1', { active: false });
  });

  it('restore and delete should call repository methods', async () => {
    repo.update = jest.fn().mockResolvedValue(undefined);
    repo.delete = jest.fn().mockResolvedValue(undefined);

    await expect(service.restore('t1')).resolves.toBeUndefined();
    await expect(service.delete('t1')).resolves.toBeUndefined();
    expect(repo.update).toHaveBeenCalled();
    expect(repo.delete).toHaveBeenCalled();
  });
});

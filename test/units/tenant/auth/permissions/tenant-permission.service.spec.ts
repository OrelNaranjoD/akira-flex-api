import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantPermission } from '../../../../../src/modules/tenant/auth/tenant-permissions/entities/tenant-permission.entity';
import { CreateTenantPermissionDto } from '../../../../../src/modules/tenant/auth/tenant-permissions/dtos/create-tenant-permission.dto';
import { UpdateTenantPermissionDto } from '../../../../../src/modules/tenant/auth/tenant-permissions/dtos/update-tenant-permission.dto';
import { TenantPermissionService } from '../../../../../src/modules/tenant/auth/tenant-permissions/tenant-permission.service';
import { NotFoundException } from '@nestjs/common';

describe('TenantPermissionService', () => {
  let service: TenantPermissionService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantPermissionService,
        { provide: getRepositoryToken(TenantPermission), useValue: repo },
      ],
    }).compile();

    service = module.get<TenantPermissionService>(TenantPermissionService);
  });

  it('create should create and save permission', async () => {
    const dto: CreateTenantPermissionDto = {
      code: 'PERM_X',
      description: 'perm x',
    };

    const saved: TenantPermission = {
      id: 'p1',
      code: dto.code,
      description: dto.description,
      roles: [],
    } as TenantPermission;
    repo.create.mockReturnValue(dto);
    repo.save.mockResolvedValue(saved);

    await expect(service.create(dto)).resolves.toEqual(saved);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('findAll should return array', async () => {
    const list = [{ id: 'p1' }];
    repo.find.mockResolvedValue(list);
    await expect(service.findAll()).resolves.toEqual(list);
  });

  it('findOne should return permission when exists', async () => {
    const perm = { id: 'p1' };
    repo.findOne.mockResolvedValue(perm);
    await expect(service.findOne('p1')).resolves.toEqual(perm);
  });

  it('findOne should throw NotFound when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update should call update and return findOne result', async () => {
    const updated: TenantPermission = {
      id: 'p1',
      code: 'PERM_Y',
      description: 'Y',
      roles: [],
    } as TenantPermission;
    repo.update.mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue(updated);
    const updateDto: UpdateTenantPermissionDto = {
      description: 'Y',
    };
    await expect(service.update('p1', updateDto)).resolves.toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith('p1', updateDto);
  });

  it('remove should find and remove', async () => {
    const perm: TenantPermission = {
      id: 'p1',
      code: 'PERM_R',
      roles: [],
    } as TenantPermission;
    jest.spyOn(service, 'findOne').mockResolvedValue(perm);
    repo.remove.mockResolvedValue(perm);

    await expect(service.remove('p1')).resolves.toEqual(perm);
    expect(repo.remove).toHaveBeenCalledWith(perm);
  });
});

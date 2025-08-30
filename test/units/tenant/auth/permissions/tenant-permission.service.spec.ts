import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformPermission } from '../../../../../src/modules/tenant/auth/permissions/entities/tenant-permission.entity';
import { CreatePlatformPermissionDto } from '../../../../../src/modules/tenant/auth/permissions/dtos/create-tenant-permission.dto';
import { UpdatePlatformPermissionDto } from '../../../../../src/modules/tenant/auth/permissions/dtos/update-tenant-permission.dto';
import { PlatformPermissionService } from '../../../../../src/modules/tenant/auth/permissions/tenant-permission.service';
import { NotFoundException } from '@nestjs/common';

describe('PlatformPermissionService', () => {
  let service: PlatformPermissionService;
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
        PlatformPermissionService,
        { provide: getRepositoryToken(PlatformPermission), useValue: repo },
      ],
    }).compile();

    service = module.get<PlatformPermissionService>(PlatformPermissionService);
  });

  it('create should create and save permission', async () => {
    const dto: CreatePlatformPermissionDto = {
      code: 'PERM_X',
      description: 'perm x',
    };

    const saved: PlatformPermission = {
      id: 'p1',
      code: dto.code,
      description: dto.description,
      roles: [],
    } as PlatformPermission;
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
    const updated: PlatformPermission = {
      id: 'p1',
      code: 'PERM_Y',
      description: 'Y',
      roles: [],
    } as PlatformPermission;
    repo.update.mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue(updated);
    const updateDto: UpdatePlatformPermissionDto = {
      description: 'Y',
    };
    await expect(service.update('p1', updateDto)).resolves.toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith('p1', updateDto);
  });

  it('remove should find and remove', async () => {
    const perm: PlatformPermission = {
      id: 'p1',
      code: 'PERM_R',
      roles: [],
    } as PlatformPermission;
    jest.spyOn(service, 'findOne').mockResolvedValue(perm);
    repo.remove.mockResolvedValue(perm);

    await expect(service.remove('p1')).resolves.toEqual(perm);
    expect(repo.remove).toHaveBeenCalledWith(perm);
  });
});

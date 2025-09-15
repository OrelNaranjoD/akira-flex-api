import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformPermissionService } from '@platform/auth/platform-permissions/platform-permission.service';
import { PlatformPermission } from '@platform/auth/platform-permissions/entities/platform-permission.entity';
import { NotFoundException } from '@nestjs/common';
import { CreatePlatformPermissionDto } from '@platform/auth/platform-permissions/dtos/create-platform-permission.dto';

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

  it('should create a permission', async () => {
    const dto: CreatePlatformPermissionDto = { code: 'A', description: 'Desc' };
    const perm = { id: '1', ...dto };
    repo.create.mockReturnValue(perm);
    repo.save.mockResolvedValue(perm);
    await expect(service.create(dto)).resolves.toEqual(perm);
  });

  it('should find all permissions', async () => {
    const perms = [{ id: '1' }];
    repo.find.mockResolvedValue(perms);
    await expect(service.findAll()).resolves.toEqual(perms);
  });

  it('should find one permission or throw', async () => {
    const p = { id: '1' };
    repo.findOne.mockResolvedValue(p);
    await expect(service.findOne('1')).resolves.toEqual(p);
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
  });
});

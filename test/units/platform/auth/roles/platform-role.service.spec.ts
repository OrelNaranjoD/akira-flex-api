import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformRole } from '@platform/auth/roles/entities/platform-role.entity';
import { CreatePlatformRoleDto } from '@platform/auth/roles/dtos/create-platform-role.dto';
import { UpdatePlatformRoleDto } from '@platform/auth/roles/dtos/update-platform-role.dto';
import { NotFoundException } from '@nestjs/common';
import { PlatformRoleService } from '@platform/auth/roles/platform-role.service';

describe('PlatformRoleService', () => {
  let service: PlatformRoleService;
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
        PlatformRoleService,
        {
          provide: getRepositoryToken(PlatformRole),
          useValue: repo,
        },
      ],
    }).compile();
    service = module.get<PlatformRoleService>(PlatformRoleService);
  });

  it('should create a platform role', async () => {
    const dto: CreatePlatformRoleDto = { name: 'Admin', permissions: ['A'] };
    const role = { id: '1', ...dto };
    repo.create.mockReturnValue(role);
    repo.save.mockResolvedValue(role);
    await expect(service.create(dto)).resolves.toEqual(role);
  });

  it('should return all platform roles', async () => {
    const roles = [{ id: '1', name: 'Admin', permissions: ['A'] }];
    repo.find.mockResolvedValue(roles);
    await expect(service.findAll()).resolves.toEqual(roles);
  });

  it('should return a platform role by id', async () => {
    const role = { id: '1', name: 'Admin', permissions: ['A'] };
    repo.findOne.mockResolvedValue(role);
    await expect(service.findOne('1')).resolves.toEqual(role);
  });

  it('should throw NotFoundException if role not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
  });

  it('should update a platform role', async () => {
    const role = { id: '1', name: 'Admin', permissions: ['A'] };
    const dto: UpdatePlatformRoleDto = { name: 'SuperAdmin' };
    repo.update.mockResolvedValue(undefined);
    const updatedRole = {
      ...role,
      ...dto,
      permissions: role.permissions.map((p) => ({ name: p })) as any,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest.spyOn(service, 'findOne').mockResolvedValue(updatedRole as unknown as PlatformRole);
    await expect(service.update('1', dto)).resolves.toEqual(updatedRole);
  });

  it('should remove a platform role', async () => {
    const role = {
      id: '1',
      name: 'Admin',
      permissions: [{ id: 'perm1', code: 'A', description: 'Permission A' }],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PlatformRole;
    jest.spyOn(service, 'findOne').mockResolvedValue(role);
    repo.remove.mockResolvedValue(role);
    await expect(service.remove('1')).resolves.toEqual(role);
  });
});

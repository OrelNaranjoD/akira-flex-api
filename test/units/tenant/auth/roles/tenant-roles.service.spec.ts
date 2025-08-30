import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTenantRoleDto } from '@tenant/auth/roles/dtos/create-tenant-role.dto';
import { UpdateTenantRoleDto } from '@tenant/auth/roles/dtos/update-tenant-role.dto';
import { NotFoundException } from '@nestjs/common';
import { TenantRoleService } from '@tenant/auth/roles/tenant-role.service';
import { TenantRole } from '@tenant/auth/roles/entities/tenant-role.entity';

describe('TenantRoleService', () => {
  let service: TenantRoleService;
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
        TenantRoleService,
        {
          provide: getRepositoryToken(TenantRole),
          useValue: repo,
        },
      ],
    }).compile();
    service = module.get<TenantRoleService>(TenantRoleService);
  });

  it('should create a tenant role', async () => {
    const dto: CreateTenantRoleDto = { name: 'User', permissions: ['B'] };
    const role = { id: '1', ...dto };
    repo.create.mockReturnValue(role);
    repo.save.mockResolvedValue(role);
    await expect(service.create(dto)).resolves.toEqual(role);
  });

  it('should return all tenant roles', async () => {
    const roles = [{ id: '1', name: 'User', permissions: ['B'] }];
    repo.find.mockResolvedValue(roles);
    await expect(service.findAll()).resolves.toEqual(roles);
  });

  it('should return a tenant role by id', async () => {
    const role = { id: '1', name: 'User', permissions: ['B'] };
    repo.findOne.mockResolvedValue(role);
    await expect(service.findOne('1')).resolves.toEqual(role);
  });

  it('should throw NotFoundException if role not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
  });

  it('should update a tenant role', async () => {
    const role = { id: '1', name: 'User', permissions: ['B'] };
    const dto: UpdateTenantRoleDto = { name: 'Manager' };
    repo.update.mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({ ...role, ...dto });
    await expect(service.update('1', dto)).resolves.toEqual({ ...role, ...dto });
  });

  it('should remove a tenant role', async () => {
    const role = { id: '1', name: 'User', permissions: ['B'] };
    jest.spyOn(service, 'findOne').mockResolvedValue(role);
    repo.remove.mockResolvedValue(role);
    await expect(service.remove('1')).resolves.toEqual(role);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TenantUserService } from '../../../../../src/modules/tenant/auth/users/tenant-user.service';
import { TenantUser } from '../../../../../src/modules/tenant/auth/users/tenant-user.entity';
import { CreateTenantUserDto as DefCreateTenantUserDto } from '@shared';
import { UpdateTenantUserDto } from '../../../../../src/modules/tenant/auth/users/dtos/update-tenant-user.dto';
import { CreateTenantUserDto } from '../../../../../src/modules/tenant/auth/users/dtos/create-tenant-user.dto';
import { TenantConnectionService } from '../../../../../src/modules/platform/tenants/services/tenant-connection.service';
import { TenantService } from '../../../../../src/modules/platform/tenants/services/tenant.service';
import { TenantContextService } from '../../../../../src/core/shared/tenant-context.service';

describe('TenantUserService', () => {
  let service: TenantUserService;
  let repo: any;
  let tenantConnectionService: any;
  let tenantService: any;
  let tenantContextService: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue(null),
      })),
      delete: jest.fn(),
    };
    tenantConnectionService = {
      getRepository: jest.fn().mockResolvedValue(repo),
    };
    tenantService = {
      findOneInternal: jest.fn(),
    };
    tenantContextService = {
      getTenantId: jest.fn().mockReturnValue('tenant-id'),
      getSchemaName: jest.fn().mockReturnValue('tenant-schema'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantUserService,
        {
          provide: getRepositoryToken(TenantUser),
          useValue: repo,
        },
        { provide: TenantConnectionService, useValue: tenantConnectionService },
        { provide: TenantService, useValue: tenantService },
        { provide: TenantContextService, useValue: tenantContextService },
      ],
    }).compile();
    service = await module.resolve<TenantUserService>(TenantUserService);
  });

  it('should create a tenant user', async () => {
    const dto: DefCreateTenantUserDto = {
      email: 'user@tenant.com',
      password: '123',
      firstName: 'User',
      lastName: 'Test',
      phone: '123456789',
      roles: ['user'],
      tenantId: 'tenant-1',
    };
    const user: TenantUser = {
      id: '1',
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone!,
      roles: dto.roles,
      tenantId: dto.tenantId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null!,
      refreshTokenHash: null,
      hashPassword: async () => {},
      comparePassword: async () => true,
    };
    repo.create.mockReturnValue(user);
    repo.save.mockResolvedValue(user);
    await expect(service.createUser(dto)).resolves.toEqual(user);
  });

  it('should register a tenant user', async () => {
    const dto: CreateTenantUserDto = {
      email: 'user2@tenant.com',
      password: '456',
      firstName: 'User2',
      lastName: 'Test2',
      phone: '987654321',
      roles: ['user'],
      tenantId: 'tenant-2',
    };
    const user: TenantUser = {
      id: '2',
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone!,
      roles: dto.roles,
      tenantId: dto.tenantId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null!,
      refreshTokenHash: null,
      hashPassword: async () => {},
      comparePassword: async () => true,
    };
    repo.create.mockReturnValue(user);
    repo.save.mockResolvedValue(user);
    await expect(service.registerUser(dto)).resolves.toEqual(user);
  });

  it('should return all tenant users', async () => {
    const users: TenantUser[] = [
      {
        id: '1',
        email: 'user@tenant.com',
        password: '123',
        firstName: 'User',
        lastName: 'Test',
        phone: '123456789',
        roles: ['user'],
        tenantId: 'tenant-1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null!,
        refreshTokenHash: null,
        hashPassword: jest.fn(),
        comparePassword: jest.fn(),
      },
    ];
    repo.find.mockResolvedValue(users);
    await expect(service.findAll()).resolves.toEqual({
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it('should return a tenant user by id', async () => {
    const user: TenantUser = {
      id: '1',
      email: 'user@tenant.com',
      password: '123',
      firstName: 'User',
      lastName: 'Test',
      phone: '123456789',
      roles: ['user'],
      tenantId: 'tenant-1',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null!,
      refreshTokenHash: null,
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };
    repo.findOne.mockResolvedValue(user);
    await expect(service.findOne('1')).resolves.toEqual(user);
  });

  it('should throw NotFoundException if user not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
  });

  it('should update a tenant user', async () => {
    const user: TenantUser = {
      id: '1',
      email: 'user@tenant.com',
      password: '123',
      firstName: 'User',
      lastName: 'Test',
      phone: '123456789',
      roles: ['user'],
      tenantId: 'tenant-1',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null!,
      refreshTokenHash: null,
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };
    const dto: UpdateTenantUserDto = {
      firstName: 'Updated',
    };
    repo.findOne.mockResolvedValue(user);
    repo.save.mockResolvedValue({ ...user, ...dto });
    await expect(service.update('1', dto)).resolves.toEqual({
      ...user,
      ...dto,
    });
  });

  it('should remove a tenant user', async () => {
    const user: TenantUser = {
      id: '1',
      email: 'user@tenant.com',
      password: '123',
      firstName: 'User',
      lastName: 'Test',
      phone: '123456789',
      roles: ['user'],
      tenantId: 'tenant-1',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null!,
      refreshTokenHash: null,
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };
    repo.findOne.mockResolvedValue(user);
    repo.save.mockResolvedValue({ ...user, active: false });
    await service.remove('1');
    expect(user.active).toBe(false);
    expect(repo.save).toHaveBeenCalledWith(user);
  });
});

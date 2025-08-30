import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantAuthService } from '@tenant/auth/tenant-auth.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import { TenantService } from '@platform/tenants/services/tenant.service';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import {
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

describe('TenantAuthService', () => {
  let service: any;
  let userRepo: any;
  let jwtService: any;
  let tenantService: any;
  let tenantConnectionService: any;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    tenantService = { findOne: jest.fn() };
    tenantConnectionService = { getRepository: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAuthService,
        { provide: getRepositoryToken(TenantUser), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: TenantService, useValue: tenantService },
        { provide: TenantConnectionService, useValue: tenantConnectionService },
      ],
    }).compile();

    service = module.get<TenantAuthService>(TenantAuthService);
  });

  it('should register and login (basic flow)', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 10, schemaName: 'tenant_t1' } as any;
    const repo: any = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(dto),
      save: jest.fn().mockResolvedValue({ id: '1', ...dto, roles: [] }),
    };

    tenantService.findOne.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.register('t1', dto)).resolves.toBeDefined();
  });

  it('register should throw Forbidden when tenant is inactive', async () => {
    const dto = { email: 'x@x.com', password: 'p' } as any;
    const tenant = { id: 't1', active: false } as any;

    tenantService.findOne.mockResolvedValue(tenant);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Forbidden when schema name missing', async () => {
    const dto = { email: 'x@x.com', password: 'p' } as any;
    const tenant = { id: 't1', active: true } as any; // no schemaName/schema

    tenantService.findOne.mockResolvedValue(tenant);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Forbidden when max users reached', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 1, schemaName: 'tenant_t1' } as any;
    const repo: any = {
      count: jest.fn().mockResolvedValue(1),
      findOne: jest.fn().mockResolvedValue(null),
    };

    tenantService.findOne.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Conflict when user already exists', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 10, schemaName: 'tenant_t1' } as any;
    const repo: any = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue({ id: 'u1', email: dto.email }),
    };

    tenantService.findOne.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('login should throw Forbidden when tenant inactive', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;
    const tenant = { id: 't1', active: false } as any;

    tenantService.findOne.mockResolvedValue(tenant);

    await expect(service.login('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login should throw Unauthorized when invalid credentials', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;
    const tenant = { id: 't1', active: true, schemaName: 'tenant_t1' } as any;

    const repo: any = {
      findOne: jest.fn().mockResolvedValue({
        id: 'u1',
        email: dto.email,
        active: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      }),
      save: jest.fn(),
    };

    tenantService.findOne.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.login('t1', dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validatePayload should throw Unauthorized when tenantId missing', async () => {
    await expect(service.validatePayload({} as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validatePayload should throw Unauthorized when user not found', async () => {
    const payload: any = { sub: 'u1', tenantId: 't1' };
    const tenant = { id: 't1', schemaName: 'tenant_t1' } as any;

    const repo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    tenantService.findOne.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.validatePayload(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('findUsers should throw Forbidden when tenant inactive', async () => {
    const tenant = { id: 't1', active: false } as any;
    tenantService.findOne.mockResolvedValue(tenant);

    await expect(service.findUsers('t1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findUsers should return users when tenant active', async () => {
    const tenant = { id: 't1', active: true } as any;
    const users = [{ id: 'u1', email: 'a@b.com' }];

    tenantService.findOne.mockResolvedValue(tenant);
    userRepo.find = jest.fn().mockResolvedValue(users);

    await expect(service.findUsers('t1')).resolves.toEqual(users);
  });

  it('updateUser should throw NotFound when user missing', async () => {
    userRepo.findOne = jest.fn().mockResolvedValue(null);

    await expect(service.updateUser('t1', 'u1', { firstName: 'x' } as any)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('updateUser should save and return updated user', async () => {
    const user = { id: 'u1', tenantId: 't1', email: 'a@b.com' } as any;
    userRepo.findOne = jest.fn().mockResolvedValue(user);
    userRepo.save = jest.fn().mockResolvedValue({ ...user, firstName: 'X' });

    await expect(service.updateUser('t1', 'u1', { firstName: 'X' } as any)).resolves.toEqual({
      ...user,
      firstName: 'X',
    });
  });

  it('deactivateUser should throw NotFound when user missing', async () => {
    userRepo.findOne = jest.fn().mockResolvedValue(null);

    await expect(service.deactivateUser('t1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivateUser should set active false and save', async () => {
    const user = { id: 'u1', tenantId: 't1', active: true } as any;
    userRepo.findOne = jest.fn().mockResolvedValue(user);
    userRepo.save = jest.fn().mockResolvedValue({ ...user, active: false });

    await expect(service.deactivateUser('t1', 'u1')).resolves.toBeUndefined();
    expect(user.active).toBe(false);
  });
});

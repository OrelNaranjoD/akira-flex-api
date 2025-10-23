import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantAuthService } from '@tenant/auth/tenant-auth.service';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import { TenantService } from '@platform/tenants/services/tenant.service';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import { TokenService } from '../../../../src/core/token/token.service';
import { ForbiddenException, ConflictException, UnauthorizedException } from '@nestjs/common';

describe('TenantAuthService', () => {
  let service: any;
  let userRepo: any;
  let jwtService: any;
  let tenantService: any;
  let tenantConnectionService: any;
  let tokenService: any;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    tenantService = { findOne: jest.fn(), findOneInternal: jest.fn() };
    tenantConnectionService = { getRepository: jest.fn() };
    tokenService = {
      generateToken: jest.fn().mockResolvedValue('token'),
      generateAccessToken: jest.fn().mockResolvedValue('access-token'),
      generateRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
      verifyRefreshToken: jest.fn().mockResolvedValue({ sub: 'user-id' }),
      verifyToken: jest.fn().mockResolvedValue({ sub: 'user-id', type: 'TENANT' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAuthService,
        { provide: getRepositoryToken(TenantUser), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: TenantService, useValue: tenantService },
        { provide: TenantConnectionService, useValue: tenantConnectionService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<TenantAuthService>(TenantAuthService);
  });

  it('should register and login (basic flow)', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 10, schemaName: 't1' } as any;
    const roleRepo: any = {
      find: jest.fn().mockResolvedValue([{ name: 'USER', permissions: ['USER_VIEW'] }]),
    };
    const repo: any = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(dto),
      save: jest.fn().mockResolvedValue({ id: '1', ...dto, roles: ['USER'] }),
    };

    tenantService.findOneInternal.mockResolvedValue(tenant);
    tenantConnectionService.getRepository
      .mockResolvedValueOnce(repo)
      .mockResolvedValueOnce(roleRepo);

    await expect(service.register('t1', dto)).resolves.toBeDefined();
    expect(repo.create).toHaveBeenCalledWith({
      ...dto,
      tenantId: 't1',
      roles: ['USER'],
    });
  });

  it('register should throw Forbidden when tenant is inactive', async () => {
    const dto = { email: 'x@x.com', password: 'p' } as any;
    const tenant = { id: 't1', active: false } as any;

    tenantService.findOneInternal.mockResolvedValue(tenant);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Forbidden when schema name missing', async () => {
    const dto = { email: 'x@x.com', password: 'p' } as any;
    const tenant = { id: 't1', active: true } as any;

    tenantService.findOneInternal.mockResolvedValue(tenant);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Forbidden when max users reached', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 1, schemaName: 't1' } as any;
    const repo: any = {
      count: jest.fn().mockResolvedValue(1),
      findOne: jest.fn().mockResolvedValue(null),
    };

    tenantService.findOneInternal.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('register should throw Conflict when user already exists', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;

    const tenant = { id: 't1', active: true, maxUsers: 10, schemaName: 't1' } as any;
    const repo: any = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue({ id: 'u1', email: dto.email }),
    };

    tenantService.findOneInternal.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.register('t1', dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('login should throw Forbidden when tenant inactive', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;
    const tenant = { id: 't1', active: false } as any;

    tenantService.findOneInternal.mockResolvedValue(tenant);

    await expect(service.login('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login should throw Unauthorized when invalid credentials', async () => {
    const dto = { email: 'a@b.com', password: 'p' } as any;
    const tenant = { id: 't1', active: true, schemaName: 't1' } as any;

    const repo: any = {
      findOne: jest.fn().mockResolvedValue({
        id: 'u1',
        email: dto.email,
        active: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      }),
      save: jest.fn(),
    };

    tenantService.findOneInternal.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.login('t1', dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validatePayload should throw Unauthorized when tenantId missing', async () => {
    await expect(service.validatePayload({} as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validatePayload should throw Unauthorized when user not found', async () => {
    const payload: any = { sub: 'u1', tenantId: 't1' };
    const tenant = { id: 't1', schemaName: 't1' } as any;

    const repo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    tenantService.findOneInternal.mockResolvedValue(tenant);
    tenantConnectionService.getRepository.mockResolvedValue(repo);

    await expect(service.validatePayload(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  describe('createTenantAdmin', () => {
    it('should create first admin user successfully', async () => {
      const dto = {
        email: 'admin@tenant.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      } as any;
      const tenant = { id: 't1', active: true, schemaName: 't1' } as any;
      const repo: any = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(dto),
        save: jest.fn().mockResolvedValue({ id: 'admin1', ...dto, roles: ['ADMIN'] }),
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        })),
        find: jest.fn().mockResolvedValue([{ name: 'ADMIN', permissions: [] }]),
      };

      tenantService.findOneInternal.mockResolvedValue(tenant);
      tenantConnectionService.getRepository.mockResolvedValue(repo);

      const result = await service.createTenantAdmin('t1', dto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('token');
      expect(repo.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 't1',
        roles: ['ADMIN'],
      });
    });

    it('should throw Forbidden when tenant is inactive', async () => {
      const dto = { email: 'admin@tenant.com', password: 'password' } as any;
      const tenant = { id: 't1', active: false } as any;

      tenantService.findOneInternal.mockResolvedValue(tenant);

      await expect(service.createTenantAdmin('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw Forbidden when schema name is missing', async () => {
      const dto = { email: 'admin@tenant.com', password: 'password' } as any;
      const tenant = { id: 't1', active: true } as any;

      tenantService.findOneInternal.mockResolvedValue(tenant);

      await expect(service.createTenantAdmin('t1', dto)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw Conflict when admin already exists', async () => {
      const dto = { email: 'admin@tenant.com', password: 'password' } as any;
      const tenant = { id: 't1', active: true, schemaName: 't1' } as any;
      const repo: any = {
        findOne: jest.fn().mockResolvedValue({ id: 'existing-admin', roles: ['ADMIN'] }),
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({ id: 'existing-admin', roles: ['ADMIN'] }),
        })),
      };

      tenantService.findOneInternal.mockResolvedValue(tenant);
      tenantConnectionService.getRepository.mockResolvedValue(repo);

      await expect(service.createTenantAdmin('t1', dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

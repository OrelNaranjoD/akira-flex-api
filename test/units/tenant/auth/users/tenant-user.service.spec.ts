import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantUser } from '../../../../../src/modules/tenant/auth/users/tenant-user.entity';
import { TenantUserService } from '../../../../../src/modules/tenant/auth/users/tenant-user.service';
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
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
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
        { provide: getRepositoryToken(TenantUser), useValue: repo },
        { provide: TenantConnectionService, useValue: tenantConnectionService },
        { provide: TenantService, useValue: tenantService },
        { provide: TenantContextService, useValue: tenantContextService },
      ],
    }).compile();
    service = await module.resolve<TenantUserService>(TenantUserService);
  });

  it('should find all tenant users', async () => {
    const users = [{ id: '1' }];
    repo.find.mockResolvedValue(users);
    tenantService.findOneInternal.mockResolvedValue({ id: 'tenant-id', schemaName: 'schema' });
    await expect(service.findAll()).resolves.toEqual({
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });
});

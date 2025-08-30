import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantUser } from '@tenant/auth/users/tenant-user.entity';
import { TenantUserService } from '@tenant/auth/users/tenant-user.service';

describe('TenantUserService', () => {
  let service: TenantUserService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantUserService, { provide: getRepositoryToken(TenantUser), useValue: repo }],
    }).compile();
    service = module.get<TenantUserService>(TenantUserService);
  });

  it('should find all tenant users', async () => {
    const users = [{ id: '1' }];
    repo.find.mockResolvedValue(users);
    await expect(service.findAll()).resolves.toEqual(users);
  });
});

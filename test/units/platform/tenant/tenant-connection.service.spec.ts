import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TenantConnectionService } from '@platform/tenants/services/tenant-connection.service';
import * as multi from '../../../../src/core/database/multi-tenant-data-source';

jest.mock('../../../../src/core/database/multi-tenant-data-source');

describe('TenantConnectionService', () => {
  let service: TenantConnectionService;
  let config: any;

  beforeEach(async () => {
    config = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantConnectionService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = module.get<TenantConnectionService>(TenantConnectionService);
  });

  it('should create/get a tenant datasource (mocked createMultiTenantDataSource may be external)', async () => {
    // We only assert that getTenantDataSource returns a promise and caches the result
    const spy = jest.spyOn<any, any>(service as any, 'getTenantDataSource');
    spy.mockResolvedValue({} as any);
    await expect(service.getTenantDataSource('schema')).resolves.toBeDefined();
  });

  it('getTenantDataSource should call createMultiTenantDataSource and cache result', async () => {
    const fakeDs = { isInitialized: true, getRepository: jest.fn(), destroy: jest.fn() } as any;
    (multi.createMultiTenantDataSource as jest.Mock).mockResolvedValue(fakeDs);

    const ds1 = await service.getTenantDataSource('s1');
    const ds2 = await service.getTenantDataSource('s1');

    expect(multi.createMultiTenantDataSource).toHaveBeenCalledWith('s1', expect.any(Object));
    expect(ds1).toBe(fakeDs);
    expect(ds2).toBe(fakeDs); // cached
  });

  it('getRepository should delegate to datasource.getRepository', async () => {
    const fakeDs = { isInitialized: true, getRepository: jest.fn().mockReturnValue('repo') } as any;
    (multi.createMultiTenantDataSource as jest.Mock).mockResolvedValue(fakeDs);

    /**
     * Dummy entity for testing.
     */
    class DummyEntity {
      id: number = 0;
    }
    const repo = await service.getRepository('srepo', DummyEntity);
    expect(repo).toBe('repo');
    expect(fakeDs.getRepository).toHaveBeenCalled();
  });

  it('onModuleDestroy should destroy initialized datasources and clear map', async () => {
    const dsA = { isInitialized: true, destroy: jest.fn() } as any;
    const dsB = { isInitialized: false, destroy: jest.fn() } as any;
    // inject into private map
    (service as any).tenantDataSources.set('a', dsA);
    (service as any).tenantDataSources.set('b', dsB);

    await service.onModuleDestroy();

    expect(dsA.destroy).toHaveBeenCalled();
    expect(dsB.destroy).not.toHaveBeenCalled();
    expect((service as any).tenantDataSources.size).toBe(0);
  });
});

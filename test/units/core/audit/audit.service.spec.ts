import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../../../../src/core/audit/audit.service';
import { AuditLog } from '../../../../src/core/audit/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: any;

  let builder: any;

  beforeEach(async () => {
    // Mock query builder with chainable methods
    builder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    repo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: getRepositoryToken(AuditLog), useValue: repo }],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should create an audit log via log()', async () => {
    const data: Partial<AuditLog> = { userId: 'u1' };
    repo.create.mockReturnValue(data);
    repo.save.mockResolvedValue({ id: 'a1', ...data });

    await expect(service.log(data)).resolves.toEqual({ id: 'a1', ...data });
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(repo.save).toHaveBeenCalled();
  });

  it('findAll should build query and return results (no filters)', async () => {
    const res = await service.findAll(2, 5);
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('audit_log');
    expect(builder.orderBy).toHaveBeenCalledWith('audit_log.created_at', 'DESC');
    expect(builder.skip).toHaveBeenCalledWith(5); // (page-1)*limit
    expect(builder.take).toHaveBeenCalledWith(5);
    expect(res).toEqual([[], 0]);
  });

  it('findAll should apply filters when provided', async () => {
    builder.andWhere.mockClear();

    const filters = {
      userId: 'u1',
      userType: 'platform',
      tenantId: 't1',
      method: 'POST',
      statusCode: 200,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-12-31'),
    } as any;

    await service.findAll(1, 10, filters);

    // Expect andWhere called for each provided filter (at least 6 filters)
    expect(builder.andWhere).toHaveBeenCalled();
    expect(builder.andWhere.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  it('findByUser should delegate to findAll with userId', async () => {
    const spy = jest.spyOn(service, 'findAll').mockResolvedValue([[], 0]);
    await expect(service.findByUser('u123', 1, 10)).resolves.toEqual([[], 0]);
    expect(spy).toHaveBeenCalledWith(1, 10, { userId: 'u123' });
    spy.mockRestore();
  });

  it('findByTenant should delegate to findAll with tenantId', async () => {
    const spy = jest.spyOn(service, 'findAll').mockResolvedValue([[], 0]);
    await expect(service.findByTenant('t123', 1, 10)).resolves.toEqual([[], 0]);
    expect(spy).toHaveBeenCalledWith(1, 10, { tenantId: 't123' });
    spy.mockRestore();
  });

  it('cleanupOldLogs should call delete where execute', async () => {
    builder.where.mockClear();
    builder.execute.mockClear();

    await expect(service.cleanupOldLogs(7)).resolves.toBeUndefined();

    expect(repo.createQueryBuilder).toHaveBeenCalled();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.where).toHaveBeenCalled();
    // verify that the where parameter contains a Date
    const whereArgs = builder.where.mock.calls[0][1];
    expect(whereArgs && whereArgs.cutoffDate instanceof Date).toBeTruthy();
    expect(builder.execute).toHaveBeenCalled();
  });
});

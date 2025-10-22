import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterDto, UserRoles } from '@orelnaranjod/flex-shared-lib';
import { PlatformUserService } from '@platform/auth/platform-users/platform-user.service';
import { TenantService } from '../../../../../src/modules/platform/tenants/services/tenant.service';
import { PlatformUser } from '@platform/auth/platform-users/entities/platform-user.entity';
import { PlatformRole } from '@platform/auth/platform-roles/entities/platform-role.entity';
import { CreatePlatformUserDto } from '@platform/auth/platform-users/dtos/create-platform-user.dto';
import { UpdatePlatformUserDto } from '@platform/auth/platform-users/dtos/update-platform-user.dto';

/**
 * Unit tests for PlatformUserService
 * Covers: createUser, registerUser, findAll, findOne, update, remove.
 */
describe('PlatformUserService', () => {
  let service: PlatformUserService;
  let repo: any;
  let roleRepo: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };
    roleRepo = { findOne: jest.fn() };
    const tenantServiceMock = { findBySubdomain: jest.fn().mockResolvedValue(null) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformUserService,
        {
          provide: TenantService,
          useValue: tenantServiceMock,
        },
        {
          provide: getRepositoryToken(PlatformUser),
          useValue: repo,
        },
        {
          provide: getRepositoryToken(PlatformRole),
          useValue: roleRepo,
        },
      ],
    }).compile();
    service = module.get<PlatformUserService>(PlatformUserService);
  });

  describe('createUser', () => {
    it('should create a user if email does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto: CreatePlatformUserDto = {
        email: 'test@test.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
      };
      const user = { ...dto };
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      await expect(service.createUser(dto)).resolves.toEqual(user);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
    it('should throw ConflictException if email already exists', async () => {
      repo.findOne.mockResolvedValue({ email: 'test@test.com' });
      const dto: CreatePlatformUserDto = {
        email: 'test@test.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
      };
      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  /**
   * Tests for registerUser().
   */
  describe('registerUser', () => {
    it('should register user if email does not exist and assign USER role', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto: RegisterDto = {
        email: 'new@user.com',
        password: 'pass',
        firstName: 'New',
        lastName: 'User',
      };
      const user = { ...dto, roles: [UserRoles.USER] };
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      await expect(service.registerUser(dto)).resolves.toEqual(user);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(user.roles).toEqual([UserRoles.USER]);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
    it('should throw ConflictException if email already exists', async () => {
      repo.findOne.mockResolvedValue({ email: 'new@user.com' });
      const dto: RegisterDto = {
        email: 'new@user.com',
        password: 'pass',
        firstName: 'New',
        lastName: 'User',
      };
      await expect(service.registerUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', email: 'test@test.com' },
        { id: '2', email: 'test2@test.com' },
      ];
      repo.findAndCount.mockResolvedValue([users, 2]);
      const result = await service.findAll();
      expect(result.users).toEqual(users.map((u) => ({ ...u, tenant: undefined })));
      expect(result.total).toBe(2);
      expect(repo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the user if exists', async () => {
      const user = { id: '1' };
      repo.findOne.mockResolvedValue(user);
      await expect(service.findOne('1')).resolves.toEqual(user);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'phone',
          'roles',
          'active',
          'createdAt',
          'updatedAt',
          'lastLogin',
        ],
        relations: ['roles', 'roles.permissions'],
      });
    });
    it('should throw NotFoundException if user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update the user', async () => {
      const user = { id: '1', firstName: 'Old' };
      const dto: UpdatePlatformUserDto = { firstName: 'New' };
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, ...dto });
      await expect(service.update('1', dto)).resolves.toEqual({ ...user, ...dto });
      expect(repo.save).toHaveBeenCalledWith({ ...user, ...dto });
    });
  });

  describe('remove', () => {
    it('should deactivate the user (soft delete)', async () => {
      const user = { id: '1', active: true };
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, active: false });
      await service.remove('1');
      expect(user.active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
  });
});

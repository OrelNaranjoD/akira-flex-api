import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformAuthService } from '../../../../src/modules/platform/auth/platform-auth.service';
import { PlatformUser } from '../../../../src/modules/platform/auth/platform-users/entities/platform-user.entity';
import { User } from '../../../../src/modules/platform/auth/users/entities/user.entity';
import { Role } from '../../../../src/modules/platform/auth/roles/entities/role.entity';
import { LoginRequestDto } from '../../../../src/modules/platform/auth/dtos/login-request.dto';
import { RegisterDto } from '../../../../src/modules/platform/auth/dtos/register.dto';
import { TokenService } from '../../../../src/core/token/token.service';
import { MailService } from '../../../../src/core/mail/mail.service';

describe('PlatformAuthService', () => {
  let service: PlatformAuthService;
  let platformUserRepo: any;
  let userRepo: any;
  let roleRepo: any;
  let tokenService: any;
  let mailService: any;

  beforeEach(async () => {
    platformUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    roleRepo = { findOne: jest.fn() };
    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue({
        accessToken: 'token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }),
      generateAndHashRefreshToken: jest.fn().mockResolvedValue({
        refreshToken: 'refresh_token',
        refreshTokenHash: 'hashed_refresh_token',
      }),
    };
    mailService = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAuthService,
        { provide: getRepositoryToken(PlatformUser), useValue: platformUserRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: TokenService, useValue: tokenService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<PlatformAuthService>(PlatformAuthService);
  });

  it('should register a new user and generate tokens', async () => {
    const dto: RegisterDto = {
      email: 'a@b.com',
      password: 'p',
      firstName: 'A',
      lastName: 'B',
    } as any;
    platformUserRepo.findOne.mockResolvedValue(null);
    const superAdminRole = { id: '1', name: 'SUPER_ADMIN' };
    roleRepo.findOne.mockResolvedValue(superAdminRole);
    const user = {
      id: '1',
      email: dto.email,
      roles: [],
      comparePassword: jest.fn(),
    } as any;
    platformUserRepo.create.mockReturnValue(user);
    platformUserRepo.save.mockResolvedValue(user);

    await expect(service.registerPlatformUser(dto)).resolves.toEqual({
      accessToken: 'token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
  });

  it('should login an existing user and return tokens', async () => {
    const dto: LoginRequestDto = { email: 'a@b.com', password: 'p' } as any;
    const user = {
      id: '1',
      email: dto.email,
      roles: [],
      comparePassword: jest.fn().mockResolvedValue(true),
      lastLogin: null,
    } as any;
    platformUserRepo.findOne.mockResolvedValue(user);
    platformUserRepo.save.mockResolvedValue({ ...user, lastLogin: new Date() });

    await expect(service.login(dto)).resolves.toEqual({
      tokenResponse: {
        accessToken: 'token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      refreshToken: 'refresh_token',
    });
  });
});

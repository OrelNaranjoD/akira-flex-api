import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformAuthService } from '@platform/auth/platform-auth.service';
import { PlatformUser } from '@platform/auth/platform-users/entities/platform-user.entity';
import { User } from '@platform/auth/users/entities/user.entity';
import { LoginRequestDto } from '@platform/auth/dtos/login-request.dto';
import { RegisterDto } from '@platform/auth/dtos/register.dto';
import { TokenService } from '@core/token/token.service';
import { MailService } from '@core/mail/mail.service';

describe('PlatformAuthService', () => {
  let service: PlatformAuthService;
  let platformUserRepo: any;
  let userRepo: any;
  let tokenService: any;
  let mailService: any;

  beforeEach(async () => {
    platformUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    tokenService = {
      generateAccessToken: jest.fn().mockResolvedValue({
        accessToken: 'token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }),
    };
    mailService = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAuthService,
        { provide: getRepositoryToken(PlatformUser), useValue: platformUserRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
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
      accessToken: 'token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
  });
});

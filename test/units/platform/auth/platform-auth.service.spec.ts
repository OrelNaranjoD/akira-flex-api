import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformAuthService } from '@platform/auth/platform-auth.service';
import { PlatformUser } from '@platform/auth/platform-users/entities/platform-user.entity';
import { LoginRequestDto } from '@platform/auth/dtos/login-request.dto';
import { RegisterDto } from '@platform/auth/dtos/register.dto';

describe('PlatformAuthService', () => {
  let service: PlatformAuthService;
  let userRepo: any;
  let jwtService: any;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAuthService,
        { provide: getRepositoryToken(PlatformUser), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
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
    userRepo.findOne.mockResolvedValue(null);
    const user = { id: '1', email: dto.email, roles: [], comparePassword: jest.fn() } as any;
    userRepo.create.mockReturnValue(user);
    userRepo.save.mockResolvedValue(user);

    await expect(service.register(dto)).resolves.toEqual({
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
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockResolvedValue({ ...user, lastLogin: new Date() });

    // spy on private validateUser via login flow
    jest.spyOn<any, any>(service as any, 'validateUser').mockResolvedValue(user);

    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
  });
});

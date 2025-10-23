import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AuditService } from '../../src/core/audit/audit.service';
import * as jwt from 'jsonwebtoken';

const testHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Jest-Test-Suite',
};

const testResponses = {
  status: { status: 'OK' },
};

/**
 * Creates and configures the test application.
 * @returns {Promise<INestApplication>} An instance of the NestJS application configured for testing.
 */
async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
        expandVariables: true,
      }),
      AppModule,
    ],
  })
    .overrideProvider(AuditService)
    .useValue({
      log: async () => Promise.resolve(),
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string) => {
        if (key === 'SUPER_ADMIN_PASSWORD') return 'password123';
        return process.env[key];
      },
    })
    .compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.init();
  return app;
}

describe('Status (e2e)', () => {
  it('/api/v1/status (GET)', async () => {
    const app = await createTestApp();
    await request(app.getHttpServer() as App)
      .get('/api/v1/status')
      .set(testHeaders)
      .expect(200)
      .expect(testResponses.status);
    await app.close();
  });
});

describe('Platform Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Login with remember flag', () => {
    it('should login with remember=true and return longer refresh token', async () => {
      const loginData = {
        email: 'admin@akiraflex.com',
        password: 'password123',
        remember: true,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/platform/login')
        .set(testHeaders)
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType');

      const cookies = response.headers['set-cookie'] as any;
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((cookie: string) =>
        cookie.startsWith('platform_refresh_token=')
      );
      expect(refreshCookie).toBeDefined();
      const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

      const decoded = jwt.decode(refreshToken as string) as jwt.JwtPayload;
      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeDefined();

      const expirationDate = new Date((decoded.exp as number) * 1000);
      const now = new Date();
      const daysDiff = Math.floor(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(8);
    });

    it('should login with remember=false and return shorter refresh token', async () => {
      const loginData = {
        email: 'admin@akiraflex.com',
        password: 'password123',
        remember: false,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/platform/login')
        .set(testHeaders)
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType');

      const cookies = response.headers['set-cookie'] as any;
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((cookie: string) =>
        cookie.startsWith('platform_refresh_token=')
      );
      expect(refreshCookie).toBeDefined();
      const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

      const decoded = jwt.decode(refreshToken as string) as jwt.JwtPayload;
      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeDefined();

      const expirationDate = new Date((decoded.exp as number) * 1000);
      const now = new Date();
      const hoursDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      expect(hoursDiff).toBeGreaterThanOrEqual(20);
      expect(hoursDiff).toBeLessThanOrEqual(28);
    });

    it('should login without remember field and default to shorter refresh token', async () => {
      const loginData = {
        email: 'admin@akiraflex.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/platform/login')
        .set(testHeaders)
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType');

      const cookies = response.headers['set-cookie'] as any;
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((cookie: string) =>
        cookie.startsWith('platform_refresh_token=')
      );
      expect(refreshCookie).toBeDefined();
      const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

      const decoded = jwt.decode(refreshToken as string) as jwt.JwtPayload;
      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeDefined();

      const expirationDate = new Date((decoded.exp as number) * 1000);
      const now = new Date();
      const hoursDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      expect(hoursDiff).toBeGreaterThanOrEqual(20);
      expect(hoursDiff).toBeLessThanOrEqual(28);
    });
  });
});

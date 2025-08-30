import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AuditService } from '../../src/core/audit/audit.service';

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

/**
 * Test suite for API (e2e).
 */
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

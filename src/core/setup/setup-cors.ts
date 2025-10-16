import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configures CORS for the NestJS application.
 * @param app The NestJS application instance.
 * @param configService The configuration service instance.
 */
export function setupCors(app: INestApplication, configService: ConfigService): void {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  let corsOrigins:
    | (string | RegExp)[]
    | string
    | boolean
    | ((
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => void);

  if (isProduction) {
    const originsFromEnv = configService.get<string>('CORS_ORIGINS');
    corsOrigins = originsFromEnv ? originsFromEnv.split(',') : ['https://akirasoftware.cl'];
  } else {
    corsOrigins = (origin: string | undefined, callback) => {
      const allowedOrigins = [
        'http://localhost:4200',
        'http://localhost:4201',
        'http://localhost:4202',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:4201',
        'http://127.0.0.1:4202',
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    };
  }

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Tenant-Id',
      'X-API-Key',
      'x-tenant-subdomain',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  });
}

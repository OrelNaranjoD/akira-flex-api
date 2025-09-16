import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

/**
 * Bootstrap function to start the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGINS?.split(',') || ['https://akirasoftware.cl']
        : process.env.CORS_ORIGINS?.split(',') || true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Tenant-Id',
      'X-API-Key',
    ],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
  });

  // CSRF and other security headers
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL ?? process.env.CORS_ORIGINS?.split(',')[0];

  const baseDirectives: Record<string, string[] | string> = {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
  };

  const devDirectives = {
    ...baseDirectives,
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: frontendUrl ? ["'self'", frontendUrl] : ["'self'"],
  };

  const prodDirectives = {
    ...baseDirectives,
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    connectSrc: frontendUrl ? ["'self'", frontendUrl] : ["'self'"],
  };

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: isProduction ? prodDirectives : devDirectives,
        reportOnly: !isProduction,
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Global prefix and API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Proxy trust
  if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  // Swagger setup
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AkiraFlex API')
      .setDescription('The AkiraFlex API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'AkiraFlex API',
      customfavIcon: '/favicon.ico',
      customCss: `
      .topbar {
        display: none !important;
      }

      .title::before {
        content: '';
        background-image: url('/logotype.svg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: inline-block;
        width: 30px;
        height: 30px;
        margin-right: 10px;
        vertical-align: middle;
      }

      .title {
        display: inline-flex !important;
        align-items: center !important;
        margin: 0 !important;
      }

      .info {
        margin: 20px 0 0 0 !important;
      }

      .scheme-container {
        background-color: #fafafa
         !important;
        padding: 0 0 10px 0 !important;
      }
    `,
    });
  }
  // Start the application
  await app.listen(process.env.PORT ?? 3000);
  Logger.debug(`Application is running on: ${await app.getUrl()}/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

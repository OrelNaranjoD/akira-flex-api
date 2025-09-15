import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

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

  // Security HTTP headers with Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Global prefix and API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('AkiraFlex API')
    .setDescription('The AkiraFlex API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
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

  // Start the application
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

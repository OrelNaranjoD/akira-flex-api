import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

/**
 * Sets up security configurations for the NestJS application.
 * @param app The NestJS application instance.
 * @param configService The configuration service instance.
 */
export function setupSecurity(app: INestApplication, configService: ConfigService): void {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  const baseDirectives: Record<string, string[] | string> = {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
  };

  const directives = isProduction
    ? {
        ...baseDirectives,
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        connectSrc: ["'self'", ...(frontendUrl ? [frontendUrl] : [])],
      }
    : {
        ...baseDirectives,
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          'http://localhost:4200',
          'http://localhost:4201',
          'http://localhost:4202',
        ],
      };

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives,
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

  app.use(cookieParser());
}

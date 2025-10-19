import { INestApplication, VersioningType } from '@nestjs/common';

/**
 * Sets up API versioning for the NestJS application.
 * @param app The NestJS application instance.
 */
export function setupApiVersioning(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
}

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configures extra settings for the NestJS application.
 * @param app The NestJS application instance.
 * @param configService The configuration service instance.
 */
export function setupAppExtras(app: INestApplication, configService: ConfigService): void {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const trustProxy = configService.get<string>('TRUST_PROXY') === 'true';

  if (isProduction || trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  if (!isProduction) {
    app
      .getHttpAdapter()
      .getInstance()
      .use((req, res, next) => {
        if (req.path === '/' && req.headers.accept?.includes('text/html')) {
          res.redirect('/docs');
        } else {
          next();
        }
      });
  }
}

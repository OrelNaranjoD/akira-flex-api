import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino-http';
import { setupValidation } from './core/setup/setup-validation';
import { setupSecurity } from './core/setup/setup-security';
import { setupCors } from './core/setup/setup-cors';
import { setupApiVersioning } from './core/setup/setup-api-versioning';
import { setupSwagger } from './core/setup/setup-swagger';
import { setupAppExtras } from './core/setup/setup-app-extras';

/**
 * Main application bootstrap function.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.use(pino());
    const configService = app.get(ConfigService);
    const nodeEnv = configService.get<string>('NODE_ENV');
    const port = configService.get<number>('PORT', 3000);

    setupValidation(app);
    setupSecurity(app, configService);
    setupCors(app, configService);
    setupApiVersioning(app);
    setupAppExtras(app, configService);
    if (nodeEnv !== 'production') {
      setupSwagger(app);
    }

    await app.listen(port);
    logger.log(`🚀 Server running at: ${await app.getUrl()}`);
    if (nodeEnv !== 'production') {
      logger.log(`📄 Swagger docs available at: ${await app.getUrl()}/docs`);
    }
  } catch (error) {
    logger.error('❌ Error starting the application', error.stack);
    process.exit(1);
  }
}

void bootstrap();

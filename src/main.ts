import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstrap function to start the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstrap function to start the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

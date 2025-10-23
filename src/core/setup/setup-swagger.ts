import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Configures Swagger for the NestJS application.
 * @param app The NestJS application instance.
 */
export function setupSwagger(app: INestApplication): void {
  const pkgPath = join(__dirname, '../../../package.json');
  let pkg = { name: 'AkiraFlex API', description: 'The AkiraFlex API description', version: '1.0' };

  const pkgRaw = readFileSync(pkgPath, 'utf-8');
  const parsed = JSON.parse(pkgRaw);
  pkg = {
    name: (parsed.name as string) ?? pkg.name,
    description: (parsed.description as string) ?? pkg.description,
    version: (parsed.version as string) ?? pkg.version,
  };

  const config = new DocumentBuilder()
    .setTitle(pkg.name)
    .setDescription(`${pkg.description} (Version: ${pkg.version})`)
    .setVersion(pkg.version)
    .addBearerAuth()
    .addServer('http://localhost:3000/api/v1', 'Local Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const newPaths = {};
  for (const path in document.paths) {
    const newPath = path.replace(/^\/api\/v1/, '');
    newPaths[newPath] = document.paths[path];
  }
  document.paths = newPaths;

  let customCss: string;
  try {
    customCss = readFileSync(join(__dirname, '../../../swagger-custom.css'), 'utf-8');
  } catch {
    customCss = '';
  }

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'AkiraFlex API',
    customfavIcon: '/favicon.ico',
    customCss,
  });
}

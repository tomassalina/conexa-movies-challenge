import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  RequestMethod,
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // `/`, `/api` and `/health` stay outside the global prefix — they're
  // discovery/liveness endpoints, not versioned resources. `@Version(VERSION_NEUTRAL)`
  // on their controllers keeps them out of URI versioning too.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'api', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Conexa Movies Challenge API')
    .setDescription(
      'Backend for a Star Wars movie management app built with NestJS: JWT ' +
        'authentication, role-based authorization (regular users vs admins), ' +
        'movie CRUD, per-user favorites, and an admin-only sync job that ' +
        'ingests catalog data from the public Star Wars API (SWAPI).',
    )
    .setVersion('0.0.1')
    .addBearerAuth()
    // Tag registration order drives the Swagger UI grouping order — there's
    // no separate "order" option, `@nestjs/swagger` just renders tags in the
    // sequence they were added here, so this list IS the display order.
    .addTag('health')
    .addTag('auth')
    .addTag('users')
    .addTag('swapi-sync')
    .addTag('movies')
    .addTag('favorites')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

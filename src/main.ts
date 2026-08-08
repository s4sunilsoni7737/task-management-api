import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  // ── Security & logging ────────────────────────────────────────────
  app.use(helmet());
  app.use(morgan('tiny'));

  // ── CORS (whitelist-based) ────────────────────────────────────────
  const allowedOrigins = configService.get<string[]>('allowedOrigins') ?? [];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl/Postman) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
  });

  // ── URI Versioning (all routes auto-prefixed /v1/) ────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const apiPrefix = configService.get<string>('apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // ── Global Validation Pipe ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global timeout interceptor (kills requests > 15s) ──────────────
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // ── Global exception filter (normalizes error response shape) ──────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription(
      'REST API for the TaskFlow Task Management System — built for the AbleSpace Full-Stack ' +
        'Developer technical assessment (Part 1). Covers guest & Google authentication, workspaces, ' +
        'projects, tasks with subtasks/comments/activity, and label taxonomy.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = configService.get<number>('port') || 8000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 TaskFlow API running on http://localhost:${port}/${apiPrefix}/v1`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs available at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();

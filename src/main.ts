import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { ALLOWED_ORIGINS, API_PREFIX, PORT } from './constants';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, { cors: false });

  // ── Security & logging ────────────────────────────────────────────
  app.use(helmet());
  app.use(morgan('tiny'));

  // ── CORS (whitelist-based) ────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl/Postman) with no Origin header.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
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

  app.setGlobalPrefix(API_PREFIX);

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
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  await app.listen(PORT);
  logger.log(`TaskFlow API running on http://localhost:${PORT}/${API_PREFIX}/v1`);
  logger.log(`Swagger docs available at http://localhost:${PORT}/${API_PREFIX}/docs`);
}
bootstrap();
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import morgan from 'morgan';
import { ALLOWED_ORIGINS, API_PREFIX } from '../src/constants';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import express from 'express';

let app: any;

export default async function (req: any, res: any) {
  if (!app) {
    const expressApp = express();
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { cors: false });
    
    nestApp.use(helmet());
    nestApp.use(morgan('tiny'));
    
    nestApp.enableCors({
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`), false);
        }
      },
      credentials: true,
    });

    nestApp.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    nestApp.setGlobalPrefix(API_PREFIX);

    nestApp.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    nestApp.useGlobalInterceptors(new TimeoutInterceptor());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('TaskFlow API')
      .setDescription('REST API for the TaskFlow Task Management System.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
      
    const document = SwaggerModule.createDocument(nestApp, swaggerConfig);
    SwaggerModule.setup(`${API_PREFIX}/docs`, nestApp, document, {
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
    });

    await nestApp.init();
    app = expressApp;
  }
  return app(req, res);
}

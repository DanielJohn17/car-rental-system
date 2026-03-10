import { NestFactory } from '@nestjs/core';
import {
  SwaggerModule,
  DocumentBuilder,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService: ConfigService = app.get(ConfigService);

  app.set('trust proxy', 'loopback');

  const allowedOrigins: string[] = readAllowedOrigins(
    configService.get<string>('API_CORS_ORIGINS'),
    ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: false,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'Accept-Version',
      'X-Request-Id',
    ],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  const bodyLimit: string =
    configService.get<string>('API_BODY_LIMIT') || '1mb';
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });

  app.enableVersioning({
    type: VersioningType.CUSTOM,
    defaultVersion: '1',
    extractor: (request: Record<string, unknown>): string => {
      const headers: unknown = request['headers'];
      if (!headers || typeof headers !== 'object') {
        return '1';
      }
      const headerRecord: Record<string, unknown> = headers as Record<
        string,
        unknown
      >;
      const value: unknown =
        headerRecord['accept-version'] ?? headerRecord['Accept-Version'];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      if (
        Array.isArray(value) &&
        typeof value[0] === 'string' &&
        value[0].trim().length > 0
      ) {
        return value[0].trim();
      }
      return '1';
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Car Rental System API')
    .setDescription('API for car rental and sharing system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  applyAcceptVersionHeader(document);
  SwaggerModule.setup('api/docs', app, document);

  const port: number = Number(configService.get<string>('PORT') || 5000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();

function applyAcceptVersionHeader(document: OpenAPIObject): void {
  const paths: Record<string, unknown> = document.paths as unknown as Record<
    string,
    unknown
  >;
  const headerSchema: Record<string, unknown> = {
    name: 'Accept-Version',
    in: 'header',
    required: false,
    schema: { type: 'string', default: '1' },
  };

  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    const operations: Record<string, unknown> = pathItem as Record<
      string,
      unknown
    >;
    for (const operation of Object.values(operations)) {
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      if (!('responses' in operation)) {
        continue;
      }
      const operationRecord: Record<string, unknown> = operation as Record<
        string,
        unknown
      >;
      const parametersUnknown: unknown = operationRecord['parameters'];
      const parameters: Record<string, unknown>[] = Array.isArray(
        parametersUnknown,
      )
        ? (parametersUnknown as Record<string, unknown>[])
        : [];
      const alreadyDefined: boolean = parameters.some(
        (parameter: Record<string, unknown>): boolean =>
          parameter['in'] === 'header' &&
          parameter['name'] === 'Accept-Version',
      );
      if (!alreadyDefined) {
        parameters.push({ ...headerSchema });
      }
      operationRecord['parameters'] = parameters;
    }
  }
}

function readAllowedOrigins(
  value: string | undefined,
  fallback: string[],
): string[] {
  if (!value) {
    return fallback;
  }
  const origins: string[] = value
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
  if (origins.length === 0) {
    return fallback;
  }
  return origins;
}

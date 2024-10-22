import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enhanced logging
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Mindscribe')
    .setDescription('A description of the MindScribe API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('mindscribe') // Optional: Add API tags
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const frontendDomain = configService.get('FRONTEND_DOMAIN') || '*';
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Enhanced Helmet configuration
  app.use(
    helmet({
      crossOriginEmbedderPolicy: !isProduction,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    }),
  );

  // Compression configuration
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Balanced compression level
    }),
  );

  // Enhanced validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        value: true,
      },
    }),
  );

  // Enhanced CORS configuration
  app.enableCors({
    origin: frontendDomain,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
    maxAge: 3600, // CORS preflight cache duration
  });

  // Trust proxy settings
  if (isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
  }

  // Global prefix (optional)
  // app.setGlobalPrefix('api/v1');

  // Start server
  await app.listen(port || 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger documentation available at: ${await app.getUrl()}/api`);
}

bootstrap().catch((error) => {
  new Logger('Bootstrap').error('Failed to start application', error);
  process.exit(1);
});

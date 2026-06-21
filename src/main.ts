import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { config } from '@/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.enableCors(config.cors);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(config.app.port);

  const logger = app.get(Logger);

  logger.log(
    {
      port: config.app.port,
      environment: config.app.environment,
    },
    'Server started successfully',
  );

  const gracefulShutdown = async (signal: string) => {
    logger.warn(
      { signal },
      'Shutdown signal received',
    );

    try {
      await app.close();

      logger.log(
        'Application closed successfully',
      );

      process.exit(0);
    } catch (error) {
      logger.error(
        { error },
        'Error during shutdown',
      );

      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM');
  });
}

bootstrap();
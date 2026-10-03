import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // Повертаємо чистий FastifyAdapter (без bodyParser: false!)
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );
  const config = app.get(ConfigService);

  await app.register(fastifyCookie);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: config.getOrThrow<string>('FRONT_URL'), credentials: true });
  app.enableShutdownHooks();

  await app.listen(config.get<number>('PORT') ?? 3001, '0.0.0.0');
}

bootstrap();

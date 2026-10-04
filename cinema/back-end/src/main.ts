import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }), { bodyParser: false}
  );
  const config = app.get(ConfigService);

  await app.register(fastifyHelmet);
  await app.register(fastifyCookie);
  await app.register(fastifyFormbody);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: config.getOrThrow<string>('FRONT_URL'), credentials: true });
  app.enableShutdownHooks();

  await app.listen(config.get<number>('PORT') ?? 3001, '0.0.0.0');
}

bootstrap();
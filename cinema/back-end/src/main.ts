import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // 🔥 ВИПРАВЛЕНО: Вимикаємо дублюючий боді-парсер всередині самого адаптера Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ 
      trustProxy: true,
      bodyLimit: 10485760, // 10MB ліміт на запити (за бажанням)
    }),
    {
      // Вимикаємо стандартний парсер NestJS, щоб не було конфлікту з fastifyFormbody
      bodyParser: false, 
      logger: ['log', 'error', 'warn', 'debug'],
    }
  );
  
  const config = app.get(ConfigService);

  await app.register(fastifyHelmet);
  
  // Реєструємо плагін для обробки стандартних HTML-форм
  await app.register(fastifyFormbody);
  
  await app.register(fastifyCookie, {
    secret: config.get<string>('COOKIE_SECRET') ?? 'super-secret-key',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: config.getOrThrow<string>('FRONT_URL'),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.enableShutdownHooks();

  const targetPort = config.get<number>('PORT') ?? 3001; 

  try {
    // Використовуємо '0.0.0.0', щоб Fastify був доступний для Next.js
    await app.listen(targetPort, '0.0.0.0'); 
    console.log(`\n\n💚 [SUCCESS] FASTIFY СЕРВЕР УСПІШНО ПІДНЯВСЯ НА http://localhost:${targetPort}\n\n`);
  } catch (err) {
    console.error('\n\n🔴 [FATAL] FASTIFY НЕ ЗМІГ ЗАЙНЯТИ ПОРТ:', err);
    process.exit(1);
  }
}

bootstrap();

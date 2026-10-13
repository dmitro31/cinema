// src/main.ts
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ 
      trustProxy: true,
      bodyLimit: 10485760,
    }),
    {
      bodyParser: false, 
      logger: ['log', 'error', 'warn', 'debug'],
    }
  );
  
  const config = app.get(ConfigService);

  await app.register(fastifyHelmet);
  await app.register(fastifyFormbody);
  
  await app.register(fastifyCookie, {
    secret: config.get<string>('COOKIE_SECRET') ?? 'super-secret-key',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 🔥 ВИПРАВЛЕНО: Додано localhost до CORS та виправлено перевірку origin
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://cinema-8595-delta.vercel.app'
      ];
      
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app\$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  app.enableShutdownHooks();

  const targetPort = config.get<number>('PORT') ?? 3001; 

  try {
    await app.listen(targetPort, '0.0.0.0'); 
    console.log(`\n\n💚 [SUCCESS] FASTIFY СЕРВЕР УСПІШНО ПІДНЯВСЯ НА http://localhost:${targetPort}\n\n`);
  } catch (err) {
    console.error('\n\n🔴 [FATAL] FASTIFY НЕ ЗМІГ ЗАЙНЯТИ ПОРТ:', err);
    process.exit(1);
  }
}

bootstrap();

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

  // Дозволяємо вікнам Google OAuth взаємодіяти з додатком через postMessage
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups', 
    },
  });
  
  await app.register(fastifyFormbody);
  
  await app.register(fastifyCookie, {
    secret: config.get<string>('COOKIE_SECRET') ?? 'super-secret-key',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 🔥 ВИПРАВЛЕНО CORS: додано всі варіації вашого Vercel домену для надійного проходження валідації
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',                  // Next.js локально
        'http://localhost:5173',                  // Vite локально
        'https://vercel.app',   // Варіант з дефісами
        'https://cinema_8595_delta.vercel.app',   // Варіант з підкресленнями (як у вікні браузера)
      ];
      
      // Додатково дозволяємо будь-які прев'ю-домени від vercel через регулярний вираз
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app\$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`), false);
      }
    },
    credentials: true, // Дозволяє браузеру зберігати та слати куки авторизації
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

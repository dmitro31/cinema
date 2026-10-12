import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('REDIS_URL'));

        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            username: url.username
              ? decodeURIComponent(url.username)
              : undefined,
            password: url.password
              ? decodeURIComponent(url.password)
              : undefined,
            db: url.pathname.length > 1
              ? Number(url.pathname.slice(1))
              : 0,
            ...(url.protocol === 'rediss:' ? { tls: {} } : {}),

            maxRetriesPerRequest: null,


            connectTimeout: 5000,


            retryStrategy(times) {
              return Math.min(times * 50, 2000);
            },
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule { }

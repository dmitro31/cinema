import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const HOLD_SCRIPT = `
for i = 1, #KEYS do
  if redis.call('EXISTS', KEYS[i]) == 1 then
    return 0
  end
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
end
return 1
`;

const RELEASE_SCRIPT = `
for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) == ARGV[1] then
    redis.call('DEL', KEYS[i])
  end
end
return 1
`;

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      // 1. Обмежуємо кількість спроб для КЕШУ, щоб уникнути нескінченного спаму в консоль
      maxRetriesPerRequest: 3, 
      
      // 2. Налаштовуємо розумну стратегію повторного підключення
      retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      
      // 3. Зменшуємо таймаут підключення, щоб завислі Windows-сокети швидше закривалися
      connectTimeout: 10000,
    });

    // 4. ОБОВ'ЯЗКОВО відловлюємо евенти помилок, щоб вони не падали як Unhandled і не смітили в термінал
    this.client.on('error', (error) => {
      // Замість величезного трейсу помилки виводимо акуратне попередження в один рядок
      console.warn(`[Redis Alert]: ${error.message}`);
    });
  }

  private holdKeys(sessionId: string, seatIds: string[]) {
    return seatIds.map((seatId) => `hold:${sessionId}:${seatId}`);
  }

  async holdSeats(
    sessionId: string,
    seatIds: string[],
    ownerId: string,
    ttlSec: number,
  ): Promise<boolean> {
    const keys = this.holdKeys(sessionId, seatIds);
    const result = await this.client.eval(HOLD_SCRIPT, keys.length, ...keys, ownerId, ttlSec);
    return result === 1;
  }

  async releaseSeats(sessionId: string, seatIds: string[], ownerId: string): Promise<void> {
    if (seatIds.length === 0) return;
    const keys = this.holdKeys(sessionId, seatIds);
    await this.client.eval(RELEASE_SCRIPT, keys.length, ...keys, ownerId);
  }

  async getHeldSeatIds(sessionId: string, seatIds: string[]): Promise<Set<string>> {
    if (seatIds.length === 0) return new Set();
    const values = await this.client.mget(this.holdKeys(sessionId, seatIds));
    return new Set(seatIds.filter((_, index) => values[index] !== null));
  }

  async onModuleDestroy() {
    // Використовуємо disconnect() замість quit(), щоб моментально закрити з'єднання при перезавантаженні сервером watch-модуля
    this.client.disconnect();
  }
}

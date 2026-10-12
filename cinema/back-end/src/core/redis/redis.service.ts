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
    // 🔥 ВИПРАВЛЕНО: Змінено на null, щоб захистити BullMQ та підписки від крешу при ECONNRESET
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null, 
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      connectTimeout: 10000,
      enableReadyCheck: true,
    });

    this.client.on('error', (error: Error) => {
      console.error('[RedisService] Redis connection error:', error.message);
    });

    this.client.on('connect', () => {
      console.log('[RedisService] Connected to Redis');
    });

    this.client.on('ready', () => {
      console.log('[RedisService] Redis is ready');
    });

    this.client.on('close', () => {
      console.warn('[RedisService] Redis connection closed');
    });

    this.client.on('reconnecting', (delay: number) => {
      console.warn(`[RedisService] Reconnecting in ${delay}ms`);
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
    const held = result === 1;
    if (held) await this.publishSeatsChanged(sessionId, seatIds);
    return held;
  }

  async releaseSeats(sessionId: string, seatIds: string[], ownerId: string): Promise<void> {
    if (seatIds.length === 0) return;
    const keys = this.holdKeys(sessionId, seatIds);
    await this.client.eval(RELEASE_SCRIPT, keys.length, ...keys, ownerId);
    await this.publishSeatsChanged(sessionId, seatIds);
  }

  async getHeldSeatIds(sessionId: string, seatIds: string[]): Promise<Set<string>> {
    if (seatIds.length === 0) return new Set();
    const values = await this.client.mget(this.holdKeys(sessionId, seatIds));
    return new Set(seatIds.filter((_, index) => values[index] !== null));
  }

  async publishSeatsChanged(sessionId: string, seatIds: string[]): Promise<void> {
    if (seatIds.length === 0) return;
    try {
      await this.client.publish(`seats:${sessionId}`, JSON.stringify({ seatIds }));
    } catch {
      return;
    }
  }

  // 🔥 ВИПРАВЛЕНО: Передаємо параметри захисту для дубльованого клієнта підписок
  createSubscriber(): Redis {
    return this.client.duplicate({
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

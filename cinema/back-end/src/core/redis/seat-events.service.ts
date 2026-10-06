import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { RedisService } from './redis.service';

type Listener = (seatIds: string[]) => void;

const FLUSH_DELAY_MS = 150;
const SEATS_CHANNEL_PREFIX = 'seats:';

@Injectable()
export class SeatEventsService implements OnModuleInit, OnModuleDestroy {
  private subscriber?: Redis;
  private timer?: NodeJS.Timeout;
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly pending = new Map<string, Set<string>>();

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    await this.redis.client
      .config('SET', 'notify-keyspace-events', 'Ex')
      .catch(() => undefined);

    const subscriber = this.redis.createSubscriber();
    subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
      this.handle(channel, message);
    });
    await subscriber.psubscribe(`${SEATS_CHANNEL_PREFIX}*`, '__keyevent@*__:expired');
    this.subscriber = subscriber;
  }

  subscribe(sessionId: string, listener: Listener): () => void {
    const set = this.listeners.get(sessionId) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(sessionId, set);

    return () => {
      const current = this.listeners.get(sessionId);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.listeners.delete(sessionId);
    };
  }

  private handle(channel: string, message: string) {
    if (channel.startsWith(SEATS_CHANNEL_PREFIX)) {
      try {
        const parsed = JSON.parse(message) as { seatIds?: string[] };
        this.enqueue(channel.slice(SEATS_CHANNEL_PREFIX.length), parsed.seatIds ?? []);
      } catch {
        return;
      }
      return;
    }

    if (channel.endsWith(':expired') && message.startsWith('hold:')) {
      const [, sessionId, seatId] = message.split(':');
      if (sessionId && seatId) this.enqueue(sessionId, [seatId]);
    }
  }

  private enqueue(sessionId: string, seatIds: string[]) {
    if (!this.listeners.has(sessionId)) return;

    const set = this.pending.get(sessionId) ?? new Set<string>();
    seatIds.forEach((seatId) => set.add(seatId));
    this.pending.set(sessionId, set);
    this.timer ??= setTimeout(() => this.flush(), FLUSH_DELAY_MS);
  }

  private flush() {
    this.timer = undefined;
    const batch = [...this.pending.entries()];
    this.pending.clear();

    for (const [sessionId, seatIds] of batch) {
      for (const listener of this.listeners.get(sessionId) ?? []) {
        try {
          listener([...seatIds]);
        } catch {
          continue;
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
    await this.subscriber?.quit();
  }
}

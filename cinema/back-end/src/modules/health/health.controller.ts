// src/modules/health/health.controller.ts
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    const [database, redis] = await Promise.all([
      this.probe(() => this.prisma.$queryRaw`SELECT 1`),
      this.probe(() => this.redis.client.ping()),
    ]);

    const status = database === 'up' && redis === 'up' ? 'ok' : 'degraded';
    if (status !== 'ok') {
      throw new ServiceUnavailableException({ status, database, redis });
    }

    return { status, database, redis, uptime: Math.round(process.uptime()) };
  }

  private async probe(action: () => PromiseLike<unknown>): Promise<'up' | 'down'> {
    try {
      await action();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
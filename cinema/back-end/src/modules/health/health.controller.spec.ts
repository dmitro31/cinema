import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> };
  let redis: { client: { ping: ReturnType<typeof vi.fn> } };
  let controller: HealthController;

  beforeEach(() => {
    prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { client: { ping: vi.fn().mockResolvedValue('PONG') } };
    controller = new HealthController(prisma as never, redis as never);
  });

  it('reports ok when the database and Redis are up', async () => {
    const result = await controller.check();

    expect(result).toMatchObject({ status: 'ok', database: 'up', redis: 'up' });
    expect(typeof result.uptime).toBe('number');
  });

  it('answers 503 when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));

    const error = await controller.check().catch((caught) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      status: 'degraded',
      database: 'down',
      redis: 'up',
    });
  });

  it('answers 503 when Redis is down', async () => {
    redis.client.ping.mockRejectedValue(new Error('redis down'));

    const error = await controller.check().catch((caught) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      status: 'degraded',
      database: 'up',
      redis: 'down',
    });
  });

  it('answers 503 and reports both when everything is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    redis.client.ping.mockRejectedValue(new Error('redis down'));

    const error = await controller.check().catch((caught) => caught);

    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      database: 'down',
      redis: 'down',
    });
  });
});
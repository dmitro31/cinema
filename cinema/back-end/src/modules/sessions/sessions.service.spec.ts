// src/modules/sessions/sessions.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_BUFFER_MIN } from './sessions.constants';
import { SessionsService } from './sessions.service';

const HOUR = 3_600_000;

const createPrismaMock = () => ({
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'session-1', ...data })),
    update: vi.fn().mockImplementation(async ({ data }) => ({ id: 'session-1', ...data })),
    delete: vi.fn().mockResolvedValue({}),
  },
  order: {
    count: vi.fn().mockResolvedValue(0),
  },
});

describe('SessionsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let movies: { getDuration: ReturnType<typeof vi.fn> };
  let halls: { assertExists: ReturnType<typeof vi.fn> };
  let service: SessionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    movies = { getDuration: vi.fn().mockResolvedValue(120) };
    halls = { assertExists: vi.fn().mockResolvedValue(undefined) };
    service = new SessionsService(prisma as never, movies as never, halls as never);
  });

  describe('create', () => {
    const dto = () => ({
      movieId: 'movie-1',
      hallId: 'hall-1',
      startAt: new Date(Date.now() + 2 * HOUR),
      price: 150,
    });

    it('computes endAt as start plus duration plus buffer', async () => {
      const input = dto();

      await service.create(input);

      const data = prisma.session.create.mock.calls[0][0].data;
      const expectedEnd = new Date(input.startAt.getTime() + (120 + SESSION_BUFFER_MIN) * 60_000);
      expect(data.endAt.getTime()).toBe(expectedEnd.getTime());
      expect(data.movieId).toBe('movie-1');
      expect(data.hallId).toBe('hall-1');
    });

    it('rejects a session that starts in the past', async () => {
      const input = { ...dto(), startAt: new Date(Date.now() - HOUR) };

      await expect(service.create(input)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('rejects when the hall is busy', async () => {
      prisma.session.findFirst.mockResolvedValue({ id: 'other' });

      await expect(service.create(dto())).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('checks overlap with strict inequalities so adjacent sessions are allowed', async () => {
      const input = dto();

      await service.create(input);

      const endAt = new Date(input.startAt.getTime() + (120 + SESSION_BUFFER_MIN) * 60_000);
      expect(prisma.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            hallId: 'hall-1',
            startAt: { lt: endAt },
            endAt: { gt: input.startAt },
          },
        }),
      );
    });

    it('propagates a missing movie', async () => {
      movies.getDuration.mockRejectedValue(new NotFoundException('Movie not found'));

      await expect(service.create(dto())).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('propagates a missing hall', async () => {
      halls.assertExists.mockRejectedValue(new NotFoundException('Hall not found'));

      await expect(service.create(dto())).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = () => ({
      id: 'session-1',
      movieId: 'movie-1',
      hallId: 'hall-1',
      startAt: new Date(Date.now() + 5 * HOUR),
      endAt: new Date(Date.now() + 8 * HOUR),
      price: 100,
      vipPrice: null,
    });

    it('throws when the session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.update('session-1', { price: 200 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('excludes the session itself from the overlap check', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());
      const newStart = new Date(Date.now() + 6 * HOUR);

      await service.update('session-1', { startAt: newStart });

      expect(prisma.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hallId: 'hall-1', id: { not: 'session-1' } }),
        }),
      );
      const data = prisma.session.update.mock.calls[0][0].data;
      expect(data.startAt).toBe(newStart);
      expect(data.endAt.getTime()).toBe(newStart.getTime() + (120 + SESSION_BUFFER_MIN) * 60_000);
    });

    it('rejects moving a session into the past', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());

      await expect(
        service.update('session-1', { startAt: new Date(Date.now() - HOUR) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('rejects an update that collides with another session', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());
      prisma.session.findFirst.mockResolvedValue({ id: 'other' });

      await expect(service.update('session-1', { price: 200 })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('rejects moving a session that has active orders', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());
      prisma.order.count.mockResolvedValue(1);

      await expect(
        service.update('session-1', { startAt: new Date(Date.now() + 6 * HOUR) }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('rejects changing the hall of a session that has active orders', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());
      prisma.order.count.mockResolvedValue(2);

      await expect(service.update('session-1', { hallId: 'hall-2' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.session.update).not.toHaveBeenCalled();
    });

    it('allows changing only the price even when there are active orders', async () => {
      prisma.session.findUnique.mockResolvedValue(existing());
      prisma.order.count.mockResolvedValue(1);

      await service.update('session-1', { price: 200 });

      expect(prisma.order.count).not.toHaveBeenCalled();
      expect(prisma.session.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rejects deleting a session that has active orders', async () => {
      prisma.order.count.mockResolvedValue(1);

      await expect(service.remove('session-1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('maps a session with order history to 409', async () => {
      prisma.session.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('session-1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps a missing session to 404', async () => {
      prisma.session.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('session-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes a session without orders', async () => {
      await service.remove('session-1');

      expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });
  });
});
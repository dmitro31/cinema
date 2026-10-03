// src/modules/tickets/tickets.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TicketsService } from './tickets.service';

const HOUR = 3_600_000;

const ticketRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'ticket-1',
  qrCode: 'valid-code-123456',
  usedAt: null,
  price: '100.00',
  seat: { row: 1, number: 1, type: 'STANDARD' },
  session: {
    id: 'session-1',
    startAt: new Date(Date.now() + 30 * 60_000),
    endAt: new Date(Date.now() + 3 * HOUR),
    movie: { id: 'movie-1', title: 'Dune', posterUrl: null },
    hall: { id: 'hall-1', name: 'Hall 1' },
  },
  ...overrides,
});

describe('TicketsService', () => {
  let prisma: {
    ticket: {
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let service: TicketsService;

  beforeEach(() => {
    prisma = {
      ticket: {
        findUnique: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
    };
    service = new TicketsService(prisma as never);
  });

  describe('validate', () => {
    it('throws when the code is unknown', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.validate('unknown-code')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a ticket that was already used', async () => {
      prisma.ticket.findUnique.mockResolvedValue(ticketRecord({ usedAt: new Date() }));

      await expect(service.validate('valid-code-123456')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a ticket for a session that has already ended', async () => {
      prisma.ticket.findUnique.mockResolvedValue(
        ticketRecord({
          session: {
            ...ticketRecord().session,
            startAt: new Date(Date.now() - 4 * HOUR),
            endAt: new Date(Date.now() - HOUR),
          },
        }),
      );

      await expect(service.validate('valid-code-123456')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('rejects entry before it opens', async () => {
      prisma.ticket.findUnique.mockResolvedValue(
        ticketRecord({
          session: {
            ...ticketRecord().session,
            startAt: new Date(Date.now() + 3 * HOUR),
            endAt: new Date(Date.now() + 6 * HOUR),
          },
        }),
      );

      await expect(service.validate('valid-code-123456')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('marks the ticket as used and returns seat and session', async () => {
      prisma.ticket.findUnique.mockResolvedValue(ticketRecord());

      const result = await service.validate('valid-code-123456');

      expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
        where: { id: 'ticket-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(result.id).toBe('ticket-1');
      expect(result.seat).toEqual({ row: 1, number: 1, type: 'STANDARD' });
      expect(result.session.movie.title).toBe('Dune');
      expect(result.usedAt).toBeInstanceOf(Date);
    });

    it('rejects when a parallel scan used the ticket first', async () => {
      prisma.ticket.findUnique.mockResolvedValue(ticketRecord());
      prisma.ticket.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.validate('valid-code-123456')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('listMine', () => {
    it('returns paid tickets of the user with numeric prices', async () => {
      prisma.ticket.findMany.mockResolvedValue([ticketRecord()]);
      prisma.ticket.count.mockResolvedValue(1);

      const result = await service.listMine('user-1', { page: 1, limit: 20 });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order: { userId: 'user-1', status: 'PAID' } },
          orderBy: { session: { startAt: 'desc' } },
        }),
      );
      expect(result.total).toBe(1);
      expect(result.items[0].price).toBe(100);
    });

    it('limits to upcoming sessions and sorts them ascending', async () => {
      prisma.ticket.findMany.mockResolvedValue([]);
      prisma.ticket.count.mockResolvedValue(0);

      await service.listMine('user-1', { page: 1, limit: 20, upcoming: true });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            order: { userId: 'user-1', status: 'PAID' },
            session: { endAt: { gte: expect.any(Date) } },
          },
          orderBy: { session: { startAt: 'asc' } },
        }),
      );
    });
  });
});
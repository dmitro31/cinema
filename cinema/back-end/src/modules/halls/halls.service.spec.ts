// src/modules/halls/halls.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HallsService } from './halls.service';

const createPrismaMock = () => ({
  hall: {
    create: vi.fn().mockResolvedValue({ id: 'hall-1' }),
    update: vi.fn().mockResolvedValue({ id: 'hall-1' }),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
});

describe('HallsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: HallsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new HallsService(prisma as never);
  });

  describe('create', () => {
    it('generates rows times seatsPerRow seats numbered from 1', async () => {
      await service.create({ name: 'Hall 1', rows: 3, seatsPerRow: 4 });

      const data = prisma.hall.create.mock.calls[0][0].data;
      const seats = data.seats.createMany.data;
      expect(seats).toHaveLength(12);
      expect(seats[0]).toEqual({ row: 1, number: 1, type: 'STANDARD' });
      expect(seats[11]).toEqual({ row: 3, number: 4, type: 'STANDARD' });
      expect(data.rows).toBe(3);
      expect(data.seatsPerRow).toBe(4);
    });

    it('marks seats in vipRows as VIP', async () => {
      await service.create({ name: 'Hall 1', rows: 3, seatsPerRow: 4, vipRows: [3] });

      const seats: { row: number; type: string }[] =
        prisma.hall.create.mock.calls[0][0].data.seats.createMany.data;
      const vip = seats.filter((seat) => seat.type === 'VIP');
      expect(vip).toHaveLength(4);
      expect(vip.every((seat) => seat.row === 3)).toBe(true);
    });

    it('rejects vipRows beyond the number of rows', async () => {
      await expect(
        service.create({ name: 'Hall 1', rows: 3, seatsPerRow: 4, vipRows: [4] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.hall.create).not.toHaveBeenCalled();
    });

    it('maps a duplicate name to 409', async () => {
      prisma.hall.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ name: 'Hall 1', rows: 3, seatsPerRow: 4 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('maps a hall with sessions to 409', async () => {
      prisma.hall.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('hall-1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps a missing hall to 404', async () => {
      prisma.hall.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('hall-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('assertExists', () => {
    it('throws when the hall is missing', async () => {
      prisma.hall.count.mockResolvedValue(0);

      await expect(service.assertExists('hall-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('passes when the hall exists', async () => {
      prisma.hall.count.mockResolvedValue(1);

      await expect(service.assertExists('hall-1')).resolves.toBeUndefined();
    });
  });
});
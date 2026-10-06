import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TicketQrService } from './ticket-qr.service';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('TicketQrService', () => {
  let prisma: { ticket: { findFirst: ReturnType<typeof vi.fn> } };
  let service: TicketQrService;

  beforeEach(() => {
    prisma = {
      ticket: { findFirst: vi.fn().mockResolvedValue({ qrCode: 'valid-ticket-code-123456' }) },
    };
    service = new TicketQrService(prisma as never);
  });

  it('only renders tickets of paid orders owned by the user', async () => {
    await service.render('user-1', 'ticket-1', 'png', 320);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: { id: 'ticket-1', order: { userId: 'user-1', status: 'PAID' } },
      select: { qrCode: true },
    });
  });

  it('throws when the ticket belongs to someone else or does not exist', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(service.render('user-2', 'ticket-1', 'png', 320)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('renders a PNG image', async () => {
    const result = await service.render('user-1', 'ticket-1', 'png', 320);

    expect(result.contentType).toBe('image/png');
    expect(result.buffer.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  });

  it('renders an SVG image', async () => {
    const result = await service.render('user-1', 'ticket-1', 'svg', 320);

    expect(result.contentType).toBe('image/svg+xml');
    expect(result.buffer.toString('utf8')).toContain('<svg');
  });

  it('encodes different codes into different images', async () => {
    const first = await service.encode('code-one-1234567890', 'svg', 256);
    const second = await service.encode('code-two-1234567890', 'svg', 256);

    expect(first.equals(second)).toBe(false);
  });

  it('honours the requested size in the SVG output', async () => {
    const small = await service.encode('valid-ticket-code-123456', 'svg', 200);
    const large = await service.encode('valid-ticket-code-123456', 'svg', 600);

    expect(small.toString('utf8')).toContain('width="200"');
    expect(large.toString('utf8')).toContain('width="600"');
  });
});

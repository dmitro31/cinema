import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/database/prisma.service';
import type { QrFormat } from './dto/ticket-qr-query.dto';

const CONTENT_TYPES: Record<QrFormat, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
};

@Injectable()
export class TicketQrService {
  constructor(private prisma: PrismaService) {}

  async render(userId: string, ticketId: string, format: QrFormat, size: number) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, order: { userId, status: 'PAID' } },
      select: { qrCode: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return {
      buffer: await this.encode(ticket.qrCode, format, size),
      contentType: CONTENT_TYPES[format],
    };
  }

  async encode(code: string, format: QrFormat, size: number): Promise<Buffer> {
    const options = { margin: 2, width: size, errorCorrectionLevel: 'M' as const };

    if (format === 'svg') {
      return Buffer.from(await QRCode.toString(code, { ...options, type: 'svg' }));
    }
    return QRCode.toBuffer(code, { ...options, type: 'png' });
  }
}

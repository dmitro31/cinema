// src/modules/tickets/tickets.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toMoney } from '../../common/utils/money';
import { PrismaService } from '../../core/database/prisma.service';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { ENTRY_OPENS_BEFORE_MIN } from './tickets.constants';

const ticketInclude = {
  seat: { select: { row: true, number: true, type: true } },
  session: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      movie: { select: { id: true, title: true, posterUrl: true } },
      hall: { select: { id: true, name: true } },
    },
  },
} as const;

const toTicketView = <T extends { price: unknown }>(ticket: T) => ({
  ...ticket,
  price: toMoney(ticket.price),
});

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async listMine(userId: string, { page, limit, upcoming }: ListTicketsDto) {
    const where = {
      order: { userId, status: 'PAID' as const },
      ...(upcoming ? { session: { endAt: { gte: new Date() } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        include: ticketInclude,
        orderBy: { session: { startAt: upcoming ? ('asc' as const) : ('desc' as const) } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items: items.map(toTicketView), total, page, limit };
  }

  async validate(code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode: code },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.usedAt) throw new ConflictException('Ticket already used');

    const now = Date.now();
    if (now > ticket.session.endAt.getTime()) {
      throw new BadRequestException('Session has already ended');
    }
    if (now < ticket.session.startAt.getTime() - ENTRY_OPENS_BEFORE_MIN * 60_000) {
      throw new BadRequestException('Entry is not open yet');
    }

    const usedAt = new Date();
    const updated = await this.prisma.ticket.updateMany({
      where: { id: ticket.id, usedAt: null },
      data: { usedAt },
    });
    if (updated.count === 0) throw new ConflictException('Ticket already used');

    return { id: ticket.id, usedAt, seat: ticket.seat, session: ticket.session };
  }
}
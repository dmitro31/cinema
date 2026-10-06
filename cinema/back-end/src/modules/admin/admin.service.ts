import { BadRequestException, Injectable } from '@nestjs/common';
import { fromCents, toCents, toMoney } from '../../common/utils/money';
import { PrismaService } from '../../core/database/prisma.service';
import { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import { ListAdminPaymentsDto } from './dto/list-admin-payments.dto';
import { ReportRangeDto } from './dto/report-range.dto';

const DAY_MS = 86_400_000;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

const ratio = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 10_000) / 10_000;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async salesReport(dto: ReportRangeDto) {
    const range = this.resolveRange(dto);
    const timezone = dto.timezone ?? 'UTC';
    const formatter = this.createDayFormatter(timezone);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: range.from, lt: range.to } },
      select: {
        orderId: true,
        price: true,
        createdAt: true,
        session: { select: { movieId: true, movie: { select: { title: true } } } },
      },
    });

    const days = new Map<string, { revenueCents: number; tickets: number; orders: Set<string> }>();
    const movies = new Map<string, { title: string; revenueCents: number; tickets: number }>();
    const orders = new Set<string>();
    let totalCents = 0;

    for (const ticket of tickets) {
      const cents = toCents(ticket.price);
      totalCents += cents;
      orders.add(ticket.orderId);

      const day = formatter.format(ticket.createdAt);
      const dayEntry = days.get(day) ?? { revenueCents: 0, tickets: 0, orders: new Set<string>() };
      dayEntry.revenueCents += cents;
      dayEntry.tickets += 1;
      dayEntry.orders.add(ticket.orderId);
      days.set(day, dayEntry);

      const movieId = ticket.session.movieId;
      const movieEntry = movies.get(movieId) ?? {
        title: ticket.session.movie.title,
        revenueCents: 0,
        tickets: 0,
      };
      movieEntry.revenueCents += cents;
      movieEntry.tickets += 1;
      movies.set(movieId, movieEntry);
    }

    return {
      range: { from: range.from, to: range.to, timezone },
      totals: { revenue: fromCents(totalCents), tickets: tickets.length, orders: orders.size },
      byDay: [...days.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, entry]) => ({
          date,
          revenue: fromCents(entry.revenueCents),
          tickets: entry.tickets,
          orders: entry.orders.size,
        })),
      byMovie: [...movies.entries()]
        .map(([movieId, entry]) => ({
          movieId,
          title: entry.title,
          revenue: fromCents(entry.revenueCents),
          tickets: entry.tickets,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }

  async occupancyReport(dto: ReportRangeDto) {
    const range = this.resolveRange(dto);

    const sessions = await this.prisma.session.findMany({
      where: { startAt: { gte: range.from, lt: range.to } },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        movie: { select: { id: true, title: true } },
        hall: { select: { id: true, name: true, rows: true, seatsPerRow: true } },
      },
    });

    const counts =
      sessions.length === 0
        ? []
        : await this.prisma.ticket.groupBy({
            by: ['sessionId'],
            where: { sessionId: { in: sessions.map((session) => session.id) } },
            _count: { _all: true },
          });
    const sold = new Map(counts.map((row) => [row.sessionId, row._count._all]));

    const halls = new Map<
      string,
      { name: string; sessions: number; seatsTotal: number; ticketsSold: number }
    >();

    const items = sessions.map((session) => {
      const seatsTotal = session.hall.rows * session.hall.seatsPerRow;
      const ticketsSold = sold.get(session.id) ?? 0;

      const hallEntry = halls.get(session.hall.id) ?? {
        name: session.hall.name,
        sessions: 0,
        seatsTotal: 0,
        ticketsSold: 0,
      };
      hallEntry.sessions += 1;
      hallEntry.seatsTotal += seatsTotal;
      hallEntry.ticketsSold += ticketsSold;
      halls.set(session.hall.id, hallEntry);

      return {
        sessionId: session.id,
        startAt: session.startAt,
        movie: session.movie,
        hall: { id: session.hall.id, name: session.hall.name },
        seatsTotal,
        ticketsSold,
        occupancy: ratio(ticketsSold, seatsTotal),
      };
    });

    return {
      range: { from: range.from, to: range.to },
      sessions: items,
      byHall: [...halls.entries()].map(([hallId, entry]) => ({
        hallId,
        name: entry.name,
        sessions: entry.sessions,
        seatsTotal: entry.seatsTotal,
        ticketsSold: entry.ticketsSold,
        occupancy: ratio(entry.ticketsSold, entry.seatsTotal),
      })),
    };
  }

  async listOrders({ page, limit, status, sessionId }: ListAdminOrdersDto) {
    const where = {
      ...(status ? { status } : {}),
      ...(sessionId ? { sessionId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          total: true,
          expiresAt: true,
          createdAt: true,
          paidByPaymentId: true,
          user: { select: { id: true, email: true, name: true } },
          session: {
            select: {
              id: true,
              startAt: true,
              movie: { select: { id: true, title: true } },
              hall: { select: { id: true, name: true } },
            },
          },
          _count: { select: { items: true, tickets: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => ({ ...order, total: toMoney(order.total) })),
      total,
      page,
      limit,
    };
  }

  async listPayments({ page, limit, status }: ListAdminPaymentsDto) {
    const where = status ? { status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderId: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          providerStatus: true,
          failureReason: true,
          createdAt: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((payment) => ({ ...payment, amount: toMoney(payment.amount) })),
      total,
      page,
      limit,
    };
  }

  private resolveRange({ from, to }: ReportRangeDto) {
    const end = to ?? new Date();
    const start = from ?? new Date(end.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);

    if (start.getTime() >= end.getTime()) {
      throw new BadRequestException('from must be earlier than to');
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
      throw new BadRequestException(`Range must not exceed ${MAX_RANGE_DAYS} days`);
    }

    return { from: start, to: end };
  }

  private createDayFormatter(timezone: string) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      throw new BadRequestException('Unknown timezone');
    }
  }
}

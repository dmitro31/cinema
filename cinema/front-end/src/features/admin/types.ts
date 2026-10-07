export type Money = number | string;

export interface ReportParams {
  from: string;
  to: string;
  timezone: string;
}

export interface DayPoint {
  date: string;
  revenue: number;
  tickets: number;
  orders: number;
}

export interface MovieSales {
  movieId: string;
  title: string;
  revenue: number;
  tickets: number;
}

export interface SalesReport {
  range: { from: string; to: string; timezone: string };
  totals: { revenue: number; tickets: number; orders: number };
  byDay: DayPoint[];
  byMovie: MovieSales[];
}

export interface OccupancySession {
  sessionId: string;
  startAt: string;
  movie: { id: string; title: string };
  hall: { id: string; name: string };
  seatsTotal: number;
  ticketsSold: number;
  occupancy: number;
}

export interface HallOccupancy {
  hallId: string;
  name: string;
  sessions: number;
  seatsTotal: number;
  ticketsSold: number;
  occupancy: number;
}

export interface OccupancyReport {
  range: { from: string; to: string };
  sessions: OccupancySession[];
  byHall: HallOccupancy[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrder {
  id: string;
  status: string;
  total: Money;
  expiresAt: string | null;
  createdAt: string;
  paidByPaymentId: string | null;
  user: { id: string; email: string; name: string };
  session: {
    id: string;
    startAt: string;
    movie: { id: string; title: string };
    hall: { id: string; name: string };
  };
  _count: { items: number; tickets: number };
}

export interface AdminPayment {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: Money;
  currency: string;
  providerStatus: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface OrdersQuery {
  page: number;
  limit: number;
  status?: string;
  sessionId?: string;
}

export interface PaymentsQuery {
  page: number;
  limit: number;
  status?: string;
}

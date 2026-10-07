import type { Session } from '@/features/admin/catalog-types';
import type { Money } from '@/features/admin/types';

export type SeatType = 'STANDARD' | 'VIP';
export type SeatStatus = 'FREE' | 'HELD' | 'SOLD';

export interface SeatInfo {
  id: string;
  row: number;
  number: number;
  type: SeatType;
  status: SeatStatus;
}

export interface SessionSeats {
  sessionId: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatInfo[];
}

export interface SessionDetails extends Omit<Session, 'movie' | 'hall'> {
  movie: {
    id: string;
    title: string;
    posterUrl: string | null;
    durationMin: number;
    ageRating: string | null;
  };
  hall: { id: string; name: string };
}

export interface HoldSeatsPayload {
  sessionId: string;
  seatIds: string[];
}

export interface OrderView {
  id: string;
  status: string;
  total: Money;
  expiresAt: string;
  seats: {
    seatId: string;
    price: Money;
    row: number;
    number: number;
    type: SeatType;
  }[];
}
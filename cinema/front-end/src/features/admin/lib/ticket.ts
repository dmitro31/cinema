export interface TicketDetails {
  movie?: string;
  hall?: string;
  seat?: string;
  startAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const text = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function describeTicket(data: unknown): TicketDetails {
  const root = isRecord(data) && isRecord(data.ticket) ? data.ticket : data;

  if (!isRecord(root)) return {};

  const session = isRecord(root.session) ? root.session : undefined;
  const movie = session && isRecord(session.movie) ? session.movie : undefined;
  const hall = session && isRecord(session.hall) ? session.hall : undefined;
  const seat = isRecord(root.seat) ? root.seat : undefined;

  return {
    movie: movie ? text(movie.title) : undefined,
    hall: hall ? text(hall.name) : undefined,
    seat:
      seat && typeof seat.row === 'number' && typeof seat.number === 'number'
        ? `Ряд ${seat.row}, місце ${seat.number}`
        : undefined,
    startAt: session ? text(session.startAt) : undefined,
  };
}

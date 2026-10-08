import type { Order } from '../types';
import { TicketGrid } from './TicketGrid';

export function Tickets({ order }: { order: Order }) {
  if (order.tickets.length === 0) return null;

  return (
    <section aria-labelledby="tickets-title" className="mt-16">
      <h2 id="tickets-title" className="mb-8 text-2xl font-bold uppercase tracking-[0.18em] sm:text-3xl">
        Квитки
      </h2>
      <TicketGrid order={order} />
    </section>
  );
}
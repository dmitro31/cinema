import { apiClient } from '@/lib/api-client';

import type { HoldSeatsPayload, OrderView, SessionDetails, SessionSeats } from '../types';

export async function getSession(id: string) {
  const { data } = await apiClient.get<SessionDetails>(`/sessions/${id}`);
  return data;
}

export async function getSessionSeats(id: string) {
  const { data } = await apiClient.get<SessionSeats>(`/sessions/${id}/seats`);
  return data;
}

export async function holdSeats(payload: HoldSeatsPayload) {
  const { data } = await apiClient.post<OrderView>('/booking/hold', payload);
  return data;
}
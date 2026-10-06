import { apiClient } from './api-client';

import type { AuthResponse } from '@/types/auth';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
}) {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/register',
    payload,
  );

  return data;
}

export async function loginWithGoogle(idToken: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/google', {
    idToken,
  });

  return data;
}

export async function refresh() {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh');

  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<AuthResponse>('/auth/me');

  return data.user;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
  }
}
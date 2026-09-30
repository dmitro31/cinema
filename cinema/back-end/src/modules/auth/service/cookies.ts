// modules/auth/cookies.ts
import type { FastifyReply } from 'fastify';
import type { FastifyCookieOptions } from '@fastify/cookie';
import {
  ACCESS_COOKIE, ACCESS_TTL_SEC, AUTH_COOKIE_PATH,
  REFRESH_COOKIE, REFRESH_TTL_SEC, SESSION_COOKIE,} from "../../../common/constants/auth.constants.js"

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

type CookieReply = FastifyReply & {
  setCookie: (name: string, value: string, options?: FastifyCookieOptions) => FastifyReply;
  clearCookie: (name: string, options?: FastifyCookieOptions) => FastifyReply;
};

export function setAuthCookies(res: FastifyReply, t: { accessToken: string; refreshToken: string }) {
  const reply = res as CookieReply;
  reply.setCookie(ACCESS_COOKIE, t.accessToken, { ...base, path: '/', maxAge: ACCESS_TTL_SEC });
  reply.setCookie(REFRESH_COOKIE, t.refreshToken, { ...base, path: AUTH_COOKIE_PATH, maxAge: REFRESH_TTL_SEC });
  reply.setCookie(SESSION_COOKIE, '1', { ...base, path: '/', maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies(res: FastifyReply) {
  const reply = res as CookieReply;
  reply.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
  reply.clearCookie(REFRESH_COOKIE, { ...base, path: AUTH_COOKIE_PATH });
  reply.clearCookie(SESSION_COOKIE, { ...base, path: '/' });
}
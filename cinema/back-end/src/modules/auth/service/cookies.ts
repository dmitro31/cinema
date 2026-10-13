// modules/auth/service/cookies.ts
import type { FastifyReply } from 'fastify';
import type { FastifyCookieOptions } from '@fastify/cookie';
import {
  ACCESS_COOKIE, ACCESS_TTL_SEC,
  REFRESH_COOKIE, REFRESH_TTL_SEC, SESSION_COOKIE,
} from "../../../common/constants/auth.constants.js";

const isProd = process.env.NODE_ENV === 'production';

// 🔥 Надійно конфігуруємо base для крос-доменних запитів (Render + Vercel)
const base: FastifyCookieOptions = {
  httpOnly: true,
  secure: true, // Завжди true для Render.com (HTTPS) та localhost (сучасні браузери вимагають secure для SameSite=None)
  sameSite: 'none', // Обов'язково для зв'язку Vercel <-> Render
  path: '/',
};

type CookieReply = FastifyReply & {
  setCookie: (name: string, value: string, options?: FastifyCookieOptions) => FastifyReply;
  clearCookie: (name: string, options?: FastifyCookieOptions) => FastifyReply;
};

export function setAuthCookies(res: FastifyReply, t: { accessToken: string; refreshToken: string }) {
  const reply = res as CookieReply;
  reply.setCookie(ACCESS_COOKIE, t.accessToken, { ...base, maxAge: ACCESS_TTL_SEC });
  reply.setCookie(REFRESH_COOKIE, t.refreshToken, { ...base, maxAge: REFRESH_TTL_SEC });
  reply.setCookie(SESSION_COOKIE, '1', { ...base, maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies(res: FastifyReply) {
  const reply = res as CookieReply;
  // 🔥 ВИПРАВЛЕНО: Передаємо повні налаштування base під час очищення
  reply.clearCookie(ACCESS_COOKIE, base);
  reply.clearCookie(REFRESH_COOKIE, base);
  reply.clearCookie(SESSION_COOKIE, base);
}

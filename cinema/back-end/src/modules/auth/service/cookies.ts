// modules/auth/service/cookies.ts
import type { FastifyReply } from 'fastify';
import {
  ACCESS_COOKIE, ACCESS_TTL_SEC,
  REFRESH_COOKIE, REFRESH_TTL_SEC, SESSION_COOKIE,
} from "../../../common/constants/auth.constants.js";

const isProd = process.env.NODE_ENV === 'production';

type CookieSerializeOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  path?: string;
  maxAge?: number;
};

// 🔥 Надійна конфігурація для локальних тестів між різними портами та для деплою
const base: CookieSerializeOptions = {
  httpOnly: true,
  secure: isProd, // true на Render (HTTPS), false для localhost (HTTP)
  sameSite: isProd ? 'none' : 'lax', // lax дозволяє обмін куками між різними портами localhost
  path: '/',
};

type CookieReply = FastifyReply & {
  setCookie: (name: string, value: string, options?: CookieSerializeOptions) => FastifyReply;
  clearCookie: (name: string, options?: CookieSerializeOptions) => FastifyReply;
};

export function setAuthCookies(res: FastifyReply, t: { accessToken: string; refreshToken: string }) {
  const reply = res as CookieReply;
  reply.setCookie(ACCESS_COOKIE, t.accessToken, { ...base, maxAge: ACCESS_TTL_SEC });
  reply.setCookie(REFRESH_COOKIE, t.refreshToken, { ...base, maxAge: REFRESH_TTL_SEC });
  reply.setCookie(SESSION_COOKIE, '1', { ...base, maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies(res: FastifyReply) {
  const reply = res as CookieReply;
  reply.clearCookie(ACCESS_COOKIE, base);
  reply.clearCookie(REFRESH_COOKIE, base);
  reply.clearCookie(SESSION_COOKIE, base);
}

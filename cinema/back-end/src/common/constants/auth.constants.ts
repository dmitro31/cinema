
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const SESSION_COOKIE = 'has_session';
export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;
export const REUSE_GRACE_MS = 10_000;
export const AUTH_COOKIE_PATH = '/api/v1/auth';
export const AUTH_MAINTENANCE_QUEUE = 'auth-maintenance';
export const CLEANUP_REFRESH_TOKENS_JOB = 'cleanup-refresh-tokens';
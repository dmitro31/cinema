
import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
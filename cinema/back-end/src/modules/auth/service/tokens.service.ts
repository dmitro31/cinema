// modules/auth/tokens.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '../../../generated/prisma/enums.js';
import type { User } from '../../../generated/prisma/client.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ACCESS_TTL_SEC, REFRESH_TTL_SEC, REUSE_GRACE_MS } from "../../../common/constants/auth.constants.js"
import { PrismaService } from '../../../core/database/prisma.service.js';

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class TokensService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccess(user: { id: string; role: Role }) {
    return this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: ACCESS_TTL_SEC },
    );
  }

  /** Нова пара токенів. familyId зберігається при ротації. */
  async issue(user: Pick<User, 'id' | 'role'>, meta: RequestMeta, familyId: string = randomUUID()) {
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        familyId,
        tokenHash: this.hash(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });
    return { accessToken: await this.signAccess(user), refreshToken };
  }

  async rotate(rawToken: string, meta: RequestMeta) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      const inGrace = Date.now() - stored.revokedAt.getTime() < REUSE_GRACE_MS;
      if (!inGrace) {
        // токен, що вже ротовано, використано пізно, тож ймовірний витік: закриваємо всю сім'ю
        await this.prisma.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Refresh token reuse detected');
      }
      // у grace-вікні це паралельний запит зі старим токеном: просто видаємо нову пару в тій самій сім'ї
    } else {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }

    const tokens = await this.issue(stored.user, meta, stored.familyId);
    return { user: stored.user, ...tokens };
  }

  /** Logout: відкликаємо всю сім'ю (сесію на цьому пристрої). */
  async revoke(rawToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (!stored) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
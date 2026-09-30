
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums';
import { PrismaService } from '../../core/database/prisma.service';
import { ListUsersDto } from './dto/list-users.dto';

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const ADMIN: Role = 'ADMIN';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  createLocal(data: { email: string; name: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  createGoogle(data: { email: string; name: string; googleId: string; avatarUrl?: string }) {
    return this.prisma.user.create({ data });
  }

  linkGoogle(id: string, googleId: string, avatarUrl?: string) {
    return this.prisma.user.update({ where: { id }, data: { googleId, avatarUrl } });
  }

  async list({ page, limit, search }: ListUsersDto) {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async changeRole(actorId: string, targetId: string, role: Role) {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: PUBLIC_USER_SELECT,
      });
      if (!target) throw new NotFoundException('User not found');
      if (target.role === role) return target;

      if (target.role === ADMIN && role !== ADMIN) {
        const admins = await tx.user.count({ where: { role: ADMIN } });
        if (admins <= 1) throw new ConflictException('At least one admin is required');
      }

      return tx.user.update({
        where: { id: targetId },
        data: { role },
        select: PUBLIC_USER_SELECT,
      });
    });
  }
}
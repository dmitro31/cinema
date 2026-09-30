// src/modules/auth/tokens.service.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REUSE_GRACE_MS } from '../../common/constants/auth.constants';
import { TokensService } from './service/tokens.service';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');

const user = { id: 'user-1', role: 'USER' };

const storedToken = (overrides: Record<string, unknown> = {}) => ({
  id: 'token-1',
  familyId: 'family-1',
  tokenHash: sha('raw-token'),
  userId: user.id,
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null,
  user,
  ...overrides,
});

const createPrismaMock = () => ({
  refreshToken: {
    findUnique: vi.fn(),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
});

describe('TokensService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let service: TokensService;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = { signAsync: vi.fn().mockResolvedValue('signed-access-token') };
    const config = { getOrThrow: vi.fn().mockReturnValue('test-secret') };
    service = new TokensService(jwt as never, prisma as never, config as never);
  });

  describe('issue', () => {
    it('returns an access token and a refresh token', async () => {
      const result = await service.issue(user as never, {});

      expect(result.accessToken).toBe('signed-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(40);
    });

    it('signs the access token with sub and role', async () => {
      await service.issue(user as never, {});

      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: user.id, role: user.role },
        expect.objectContaining({ secret: 'test-secret' }),
      );
    });

    it('stores only the hash of the refresh token', async () => {
      const result = await service.issue(user as never, { userAgent: 'vitest', ip: '127.0.0.1' });

      const data = prisma.refreshToken.create.mock.calls[0][0].data;
      expect(data.tokenHash).toBe(sha(result.refreshToken));
      expect(data.tokenHash).not.toBe(result.refreshToken);
      expect(data.userId).toBe(user.id);
      expect(data.userAgent).toBe('vitest');
      expect(data.ip).toBe('127.0.0.1');
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('creates a new family when none is provided', async () => {
      await service.issue(user as never, {});
      await service.issue(user as never, {});

      const first = prisma.refreshToken.create.mock.calls[0][0].data.familyId;
      const second = prisma.refreshToken.create.mock.calls[1][0].data.familyId;
      expect(first).not.toBe(second);
    });
  });

  describe('rotate', () => {
    it('revokes the old token and issues a new one in the same family', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken());

      const result = await service.rotate('raw-token', {});

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash: sha('raw-token') } }),
      );
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ familyId: 'family-1', userId: user.id }),
      });
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(result.user).toBe(user);
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).not.toBe('raw-token');
    });

    it('rejects an unknown token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotate('unknown', {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.rotate('raw-token', {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('accepts a recently rotated token inside the grace window', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({ revokedAt: new Date(Date.now() - REUSE_GRACE_MS / 2) }),
      );

      const result = await service.rotate('raw-token', {});

      expect(result.accessToken).toBe('signed-access-token');
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ familyId: 'family-1' }),
      });
    });

    it('revokes the whole family when a token is reused after the grace window', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({ revokedAt: new Date(Date.now() - REUSE_GRACE_MS - 1_000) }),
      );

      await expect(service.rotate('raw-token', {})).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('revokes the whole family of a known token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken());

      await service.revoke('raw-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('does nothing for an unknown token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await service.revoke('unknown');

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from './account.service';

const profile = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Updated',
  role: 'USER',
  avatarUrl: null,
  createdAt: new Date(),
};

describe('AccountService', () => {
  let oldHash: string;
  let prisma: {
    user: { update: ReturnType<typeof vi.fn> };
    refreshToken: { updateMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let users: { findById: ReturnType<typeof vi.fn> };
  let tokens: { issue: ReturnType<typeof vi.fn> };
  let service: AccountService;

  const meta = { userAgent: 'vitest', ip: '127.0.0.1' };
  const userRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    email: 'user@test.com',
    role: 'USER',
    passwordHash: oldHash,
    ...overrides,
  });

  beforeAll(async () => {
    oldHash = await argon2.hash('OldPassw0rd!');
  });

  beforeEach(() => {
    prisma = {
      user: { update: vi.fn().mockResolvedValue(profile) },
      refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
      $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
    };
    users = { findById: vi.fn().mockResolvedValue(userRecord()) };
    tokens = {
      issue: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    };
    service = new AccountService(prisma as never, users as never, tokens as never);
  });

  describe('updateProfile', () => {
    it('updates only the name and returns the public fields', async () => {
      const result = await service.updateProfile('user-1', { name: 'Updated' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated' },
        select: expect.objectContaining({ id: true, email: true, name: true, role: true }),
      });
      expect(result).toEqual(profile);
    });
  });

  describe('changePassword', () => {
    it('throws when the user no longer exists', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', { newPassword: 'NewPassw0rd!' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong current password', async () => {
      await expect(
        service.changePassword(
          'user-1',
          { currentPassword: 'wrong-password', newPassword: 'NewPassw0rd!' },
          meta,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tokens.issue).not.toHaveBeenCalled();
    });

    it('rejects a missing current password when the account has one', async () => {
      await expect(
        service.changePassword('user-1', { newPassword: 'NewPassw0rd!' }, meta),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('stores a hash of the new password and revokes every refresh token', async () => {
      await service.changePassword(
        'user-1',
        { currentPassword: 'OldPassw0rd!', newPassword: 'NewPassw0rd!' },
        meta,
      );

      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.passwordHash).not.toBe('NewPassw0rd!');
      expect(await argon2.verify(data.passwordHash, 'NewPassw0rd!')).toBe(true);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('issues fresh tokens for the current device and returns the profile', async () => {
      const result = await service.changePassword(
        'user-1',
        { currentPassword: 'OldPassw0rd!', newPassword: 'NewPassw0rd!' },
        meta,
      );

      expect(tokens.issue).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), meta);
      expect(result.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(result.user).toEqual(profile);
    });

    it('lets an account without a password set one without a current password', async () => {
      users.findById.mockResolvedValue(userRecord({ passwordHash: null }));

      await service.changePassword('user-1', { newPassword: 'NewPassw0rd!' }, meta);

      const data = prisma.user.update.mock.calls[0][0].data;
      expect(await argon2.verify(data.passwordHash, 'NewPassw0rd!')).toBe(true);
      expect(tokens.issue).toHaveBeenCalled();
    });
  });
});

// src/modules/users/users.service.spec.ts
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

const publicUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'target',
  email: 't@example.com',
  name: 'Target',
  role: 'USER',
  avatarUrl: null,
  createdAt: new Date(),
  ...overrides,
});

describe('UsersService.changeRole', () => {
  let tx: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    tx = {
      user: {
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    service = new UsersService(prisma as never);
  });

  it('forbids changing your own role', async () => {
    await expect(service.changeRole('admin', 'admin', 'USER')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws when the target does not exist', async () => {
    tx.user.findUnique.mockResolvedValue(null);

    await expect(service.changeRole('admin', 'target', 'ADMIN')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('promotes a user to admin', async () => {
    tx.user.findUnique.mockResolvedValue(publicUser());
    tx.user.update.mockResolvedValue(publicUser({ role: 'ADMIN' }));

    const result = await service.changeRole('admin', 'target', 'ADMIN');

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'target' }, data: { role: 'ADMIN' } }),
    );
    expect(result.role).toBe('ADMIN');
  });

  it('does not touch the database when the role is the same', async () => {
    tx.user.findUnique.mockResolvedValue(publicUser({ role: 'ADMIN' }));

    const result = await service.changeRole('admin', 'target', 'ADMIN');

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(result.role).toBe('ADMIN');
  });

  it('refuses to demote the last admin', async () => {
    tx.user.findUnique.mockResolvedValue(publicUser({ role: 'ADMIN' }));
    tx.user.count.mockResolvedValue(1);

    await expect(service.changeRole('other', 'target', 'USER')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('demotes an admin when another admin remains', async () => {
    tx.user.findUnique.mockResolvedValue(publicUser({ role: 'ADMIN' }));
    tx.user.count.mockResolvedValue(2);
    tx.user.update.mockResolvedValue(publicUser({ role: 'USER' }));

    const result = await service.changeRole('other', 'target', 'USER');

    expect(result.role).toBe('USER');
  });
});
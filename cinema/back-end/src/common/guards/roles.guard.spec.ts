// src/common/guards/roles.guard.spec.ts
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../../modules/users/users.service';
import { RolesGuard } from './roles.guard';

const createContext = (user?: { sub: string; role: string }) => {
  const request: { user?: { sub: string; role: string } } = { user };
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
};

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() };
  const users = { findById: vi.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    vi.resetAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector, users as unknown as UsersService);
  });

  it('allows the request when no roles are required and skips the database', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createContext({ sub: 'u1', role: 'USER' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('allows an admin according to the database', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    users.findById.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
    const { context } = createContext({ sub: 'u1', role: 'ADMIN' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('forbids a user who was demoted after the token was issued', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    users.findById.mockResolvedValue({ id: 'u1', role: 'USER' });
    const { context } = createContext({ sub: 'u1', role: 'ADMIN' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids a regular user', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    users.findById.mockResolvedValue({ id: 'u1', role: 'USER' });
    const { context } = createContext({ sub: 'u1', role: 'USER' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('answers 401 when the user no longer exists', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    users.findById.mockResolvedValue(null);
    const { context } = createContext({ sub: 'u1', role: 'ADMIN' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('forbids a request without an authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const { context } = createContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('writes the role from the database into request.user', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    users.findById.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
    const { context, request } = createContext({ sub: 'u1', role: 'USER' });

    await guard.canActivate(context);

    expect(request.user).toEqual({ sub: 'u1', role: 'ADMIN' });
  });
});
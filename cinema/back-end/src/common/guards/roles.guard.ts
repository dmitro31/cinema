// src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../generated/prisma/enums';
import type { FastifyRequest } from 'fastify';
import { UsersService } from '../../modules/users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    if (!req.user) throw new ForbiddenException('Insufficient permissions');

    const current = await this.users.findById(req.user.sub);
    if (!current) throw new UnauthorizedException('User no longer exists');
    if (!required.includes(current.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    req.user = { ...req.user, role: current.role };
    return true;
  }
}
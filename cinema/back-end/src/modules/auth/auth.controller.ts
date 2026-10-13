import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { User } from '../../generated/prisma/client.js';
import { REFRESH_COOKIE } from '../../common/constants/auth.constants.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { JwtPayload } from '../../common/types/fastify.js';

import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { TokensService } from './service/tokens.service.js';
import { clearAuthCookies, setAuthCookies } from './service/cookies.js';

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatarUrl: user.avatarUrl,
});

const metaOf = (req: FastifyRequest) => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
    private readonly users: UsersService,
  ) { }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { user, ...tokens } = await this.auth.register(dto, metaOf(req));
    setAuthCookies(res, tokens);
    return { user: publicUser(user), ...tokens }; // 🔥 Повертаємо токени у відповіді
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { user, ...tokens } = await this.auth.login(dto, metaOf(req));
    setAuthCookies(res, tokens);
    return { user: publicUser(user), ...tokens }; // 🔥 Повертаємо токени у відповіді
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  async google(@Body() dto: GoogleLoginDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { user, ...tokens } = await this.auth.googleLogin(
      dto as unknown as Parameters<AuthService['googleLogin']>[0],
      metaOf(req),
    );
    setAuthCookies(res, tokens);
    return { user: publicUser(user), ...tokens }; // 🔥 Повертаємо токени у відповіді
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body('refreshToken') bodyToken?: string,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || bodyToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const { user, ...tokens } = await this.tokens.rotate(refreshToken, metaOf(req));
      setAuthCookies(res, tokens);
      return { user: publicUser(user), ...tokens };
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  @Public()
  @Get('google/callback')
  @HttpCode(200)
  async googleCallback(
    @Req() req: FastifyRequest & {
      user?: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
      };
    },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const profile = req.user;

    if (!profile?.googleId || !profile.email) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const { user, ...tokens } = await this.auth.googleLogin(
      profile,
      metaOf(req),
    );

    setAuthCookies(res, tokens);

    return {
      user: publicUser(user),
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // 🔥 ВИПРАВЛЕНО: Безпечний чейнінг для Fastify-кук
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (refreshToken) {
      await this.tokens.revoke(refreshToken);
    }

    clearAuthCookies(res);
  }

  @Get('me')
  async me(@CurrentUser() jwt: JwtPayload) {
    // Захист: якщо гвард не зміг розпарсити токен, jwt буде порожнім
    if (!jwt || !jwt.sub) {
      throw new UnauthorizedException('Token is missing or invalid');
    }

    const user = await this.users.findById(jwt.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: publicUser(user),
    };
  }
}

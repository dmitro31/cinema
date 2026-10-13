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
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { user, ...tokens } = await this.auth.register(dto, metaOf(req));

    setAuthCookies(res, tokens);

    return {
      user: publicUser(user),
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // ВИПРАВЛЕНО: Для звичайного входу викликаємо стандартний метод login()
    const { user, ...tokens } = await this.auth.login(dto, metaOf(req));

    setAuthCookies(res, tokens);

    return {
      user: publicUser(user),
    };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('google')
  @HttpCode(200)
  async google(
    @Body() dto: GoogleLoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // ВИПРАВЛЕНО: Для Google-авторизації через idToken викликаємо відповідний метод,
    // який всередині AuthService верифікує токен через google-auth-library
    const { user, ...tokens } = await this.auth.googleLogin(
      dto as unknown as Parameters<AuthService['googleLogin']>[0],
      metaOf(req),
    );

    setAuthCookies(res, tokens);

    return {
      user: publicUser(user),
    };
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

    // Тут передається розпарсений об'єкт профілю з Passport.js стратегії.
    // Якщо ваш метод googleLogin очікує саме такий об'єкт, то все працюватиме.
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
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const { user, ...tokens } = await this.tokens.rotate(
        refreshToken,
        metaOf(req),
      );

      setAuthCookies(res, tokens);

      return {
        user: publicUser(user),
      };
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE];

    if (refreshToken) {
      await this.tokens.revoke(refreshToken);
    }

    clearAuthCookies(res);
  }

  @Get('me')
  async me(@CurrentUser() jwt: JwtPayload) {
    const user = await this.users.findById(jwt.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user: publicUser(user),
    };
  }
}

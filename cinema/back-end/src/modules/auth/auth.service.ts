import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service.js';
import { RequestMeta, TokensService } from './service/tokens.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class AuthService {
  private google: OAuth2Client;

  constructor(
    private users: UsersService,
    private tokens: TokensService,
    private config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Ініціалізуємо клієнт з використанням як ID, так і SECRET ключів
    this.google = new OAuth2Client(
      this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  /** Верифікація отриманого idToken через офіційну бібліотеку Google */
  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.google.verifyIdToken({
        idToken,
        audience: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Google token verification failed');
    }
  }

  async register(dto: RegisterDto, meta: RequestMeta) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.createLocal({
      email: dto.email,
      name: dto.name,
      passwordHash: await argon2.hash(dto.password),
    });
    return { user, ...(await this.tokens.issue(user, meta)) };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.users.findByEmail(dto.email);
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { user, ...(await this.tokens.issue(user, meta)) };
  }

  /** Головний метод авторизації через Google (з підтримкою DTO або чистого профілю для Callback) */
  async googleLogin(
    dtoOrProfile: GoogleLoginDto | { googleId: string; email: string; name: string; avatarUrl?: string },
    meta: RequestMeta = {},
  ) {
    let profile: { googleId: string; email: string; name: string; avatarUrl?: string };

    // Якщо прийшов DTO з токеном від фронтенду — валідуємо його
    if ('idToken' in dtoOrProfile) {
      profile = await this.verifyGoogleToken(dtoOrProfile.idToken);
    } else {
      // Якщо прийшов готовий профіль (наприклад, з Passport.js стратегії сервером)
      profile = dtoOrProfile;
    }

    const email = profile.email.trim().toLowerCase();

    const existingOAuthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'GOOGLE',
          providerId: profile.googleId,
        },
      },
      include: {
        user: true,
      },
    });

    let user = existingOAuthAccount?.user;

    if (!user) {
      user = (await this.prisma.user.findUnique({
        where: { email },
      })) ?? undefined;
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          provider: 'GOOGLE',
          passwordHash: null,
          oauthAccounts: {
            create: {
              provider: 'GOOGLE',
              providerId: profile.googleId,
              email,
            },
          },
        },
      });
    } else {
      if (!existingOAuthAccount) {
        await this.prisma.oAuthAccount.create({
          data: {
            provider: 'GOOGLE',
            providerId: profile.googleId,
            email,
            userId: user.id,
          },
        });
      }

      const updateData: {
        provider?: 'GOOGLE';
        avatarUrl?: string;
      } = {};

      if (user.provider === 'LOCAL') {
        updateData.provider = 'GOOGLE';
      }

      if (!user.avatarUrl && profile.avatarUrl) {
        updateData.avatarUrl = profile.avatarUrl;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const tokens = await this.tokens.issue(user, meta);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

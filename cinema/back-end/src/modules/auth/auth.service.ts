
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { RequestMeta, TokensService } from './service/tokens.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private google: OAuth2Client;

  constructor(
    private users: UsersService,
    private tokens: TokensService,
    private config: ConfigService,
  ) {
    this.google = new OAuth2Client(config.getOrThrow('GOOGLE_CLIENT_ID'));
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
    // однакова помилка для "немає юзера" і "неправильний пароль"
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { user, ...(await this.tokens.issue(user, meta)) };
  }

  async loginWithGoogle(idToken: string, meta: RequestMeta) {
    const ticket = await this.google
      .verifyIdToken({ idToken, audience: this.config.getOrThrow('GOOGLE_CLIENT_ID') })
      .catch(() => {
        throw new UnauthorizedException('Invalid Google token');
      });

    const p = ticket.getPayload();
    if (!p?.sub || !p.email || !p.email_verified) {
      throw new UnauthorizedException('Google email is not verified');
    }
    const email = p.email.toLowerCase();

    let user = await this.users.findByGoogleId(p.sub);
    if (!user) {
      const existing = await this.users.findByEmail(email);
      user = existing
        ? await this.users.linkGoogle(existing.id, p.sub, p.picture) // той самий email, лінкуємо акаунти
        : await this.users.createGoogle({
            email,
            name: p.name ?? email.split('@')[0],
            googleId: p.sub,
            avatarUrl: p.picture,
          });
    }
    return { user, ...(await this.tokens.issue(user, meta)) };
  }
}
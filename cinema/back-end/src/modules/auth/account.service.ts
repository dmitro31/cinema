import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../core/database/prisma.service';
import { PUBLIC_USER_SELECT, UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestMeta, TokensService } from './service/tokens.service'

@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private tokens: TokensService,
  ) {}

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
      select: PUBLIC_USER_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto, meta: RequestMeta) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (user.passwordHash) {
      const valid =
        !!dto.currentPassword && (await argon2.verify(user.passwordHash, dto.currentPassword));
      if (!valid) throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(dto.newPassword);

    const [profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: PUBLIC_USER_SELECT,
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    const tokens = await this.tokens.issue(user, meta);
    return { user: profile, tokens };
  }
}

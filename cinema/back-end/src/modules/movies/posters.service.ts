import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { PrismaService } from '../../core/database/prisma.service';
import { detectImageType } from './image-type';

@Injectable()
export class PostersService {
  private readonly directory: string;
  private readonly publicBase: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.directory = join(resolve(config.get<string>('UPLOADS_DIR') ?? 'uploads'), 'posters');
    this.publicBase = `${config.getOrThrow<string>('API_PUBLIC_URL').replace(/\/+$/, '')}/uploads/posters/`;
  }

  async setPoster(movieId: string, buffer: Buffer) {
    const type = detectImageType(buffer);
    if (!type) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, posterUrl: true },
    });
    if (!movie) throw new NotFoundException('Movie not found');

    await mkdir(this.directory, { recursive: true });
    const filename = `${randomUUID()}.${type}`;
    await writeFile(join(this.directory, filename), buffer);

    const posterUrl = `${this.publicBase}${filename}`;
    try {
      await this.prisma.movie.update({ where: { id: movieId }, data: { posterUrl } });
    } catch (error) {
      await this.removeFile(posterUrl);
      throw error;
    }

    await this.removeFile(movie.posterUrl);
    return { posterUrl };
  }

  async removePoster(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, posterUrl: true },
    });
    if (!movie) throw new NotFoundException('Movie not found');

    await this.prisma.movie.update({ where: { id: movieId }, data: { posterUrl: null } });
    await this.removeFile(movie.posterUrl);
  }

  private async removeFile(posterUrl: string | null) {
    if (!posterUrl || !posterUrl.startsWith(this.publicBase)) return;

    const filename = basename(posterUrl.slice(this.publicBase.length));
    await rm(join(this.directory, filename), { force: true });
  }
}

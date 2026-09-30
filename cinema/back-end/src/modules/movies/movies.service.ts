import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hasPrismaCode } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../core/database/prisma.service';
import { GenresService } from '../genres/genres.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryMoviesDto } from './dto/query-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

const movieInclude = {
  genres: { select: { genre: { select: { id: true, name: true } } } },
} as const;

type MovieRecord = {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  ageRating: string | null;
  releaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  genres: { genre: { id: string; name: string } }[];
};

const toMovie = ({ genres, ...movie }: MovieRecord) => ({
  ...movie,
  genres: genres.map((item) => item.genre),
});

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private genres: GenresService,
  ) {}

  async list({ page, limit, search, genreId, nowShowing }: QueryMoviesDto) {
    const where = {
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(genreId ? { genres: { some: { genreId } } } : {}),
      ...(nowShowing ? { sessions: { some: { startAt: { gte: new Date() } } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        where,
        include: movieInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.movie.count({ where }),
    ]);

    return { items: items.map(toMovie), total, page, limit };
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUnique({ where: { id }, include: movieInclude });
    if (!movie) throw new NotFoundException('Movie not found');
    return toMovie(movie);
  }

  async getDuration(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      select: { durationMin: true },
    });
    if (!movie) throw new NotFoundException('Movie not found');
    return movie.durationMin;
  }

  async create(dto: CreateMovieDto) {
    const genreIds = dto.genreIds ?? [];
    await this.genres.assertAllExist(genreIds);

    const movie = await this.prisma.movie.create({
      data: {
        title: dto.title,
        description: dto.description,
        durationMin: dto.durationMin,
        posterUrl: dto.posterUrl,
        trailerUrl: dto.trailerUrl,
        ageRating: dto.ageRating,
        releaseDate: dto.releaseDate,
        genres: { create: genreIds.map((genreId) => ({ genreId })) },
      },
      include: movieInclude,
    });

    return toMovie(movie);
  }

  async update(id: string, dto: UpdateMovieDto) {
    if (dto.genreIds) await this.genres.assertAllExist(dto.genreIds);

    if (dto.durationMin !== undefined && dto.durationMin !== null) {
      const upcoming = await this.prisma.session.count({
        where: { movieId: id, startAt: { gte: new Date() } },
      });
      if (upcoming > 0) {
        throw new ConflictException('Cannot change duration while the movie has upcoming sessions');
      }
    }

    try {
      const movie = await this.prisma.movie.update({
        where: { id },
        data: {
          title: dto.title ?? undefined,
          description: dto.description ?? undefined,
          durationMin: dto.durationMin ?? undefined,
          posterUrl: dto.posterUrl,
          trailerUrl: dto.trailerUrl,
          ageRating: dto.ageRating,
          releaseDate: dto.releaseDate,
          genres: dto.genreIds
            ? { deleteMany: {}, create: dto.genreIds.map((genreId) => ({ genreId })) }
            : undefined,
        },
        include: movieInclude,
      });
      return toMovie(movie);
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Movie not found');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.movie.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Movie not found');
      if (hasPrismaCode(error, 'P2003')) throw new ConflictException('Movie has sessions');
      throw error;
    }
  }
}
// src/seed.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as argon2 from 'argon2';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './core/database/prisma.module';
import { PrismaService } from './core/database/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), PrismaModule],
})
class SeedModule {}

const DAYS = 7;
const BUFFER_MIN = 15;
const GAP_MIN = 20;
const FIRST_START_HOUR = 10;
const LAST_END_HOUR = 24;

const GENRES = ['Бойовик', 'Комедія', 'Драма', 'Фантастика', 'Жахи', 'Мультфільм', 'Трилер'];

const HALLS = [
  { name: 'Зал 1', rows: 8, seatsPerRow: 10, vipRows: [8], price: 120, vipPrice: 200 },
  { name: 'Зал 2', rows: 6, seatsPerRow: 8, vipRows: [6], price: 120, vipPrice: 200 },
  { name: 'IMAX', rows: 10, seatsPerRow: 14, vipRows: [9, 10], price: 180, vipPrice: 300 },
];

const MOVIES = [
  {
    title: 'Остання станція',
    description: 'Нічний потяг, до якого ніхто не мав сідати. Пасажири дізнаються, куди він їде насправді.',
    durationMin: 128,
    ageRating: '16+',
    genres: ['Трилер', 'Драма'],
  },
  {
    title: 'Орбіта',
    description: 'Екіпаж дослідницької станції отримує сигнал із планети, яку вважали мертвою.',
    durationMin: 152,
    ageRating: '12+',
    genres: ['Фантастика', 'Бойовик'],
  },
  {
    title: 'Країна лисиць',
    description: 'Анімаційна історія про лисеня, яке вирішило знайти край світу і повернутися до вечері.',
    durationMin: 96,
    ageRating: '0+',
    genres: ['Мультфільм', 'Комедія'],
  },
  {
    title: 'Нічне місто',
    description: 'Детектив, який не спить третю добу, розплутує справу про зникнення цілого кварталу.',
    durationMin: 118,
    ageRating: '16+',
    genres: ['Бойовик', 'Трилер'],
  },
  {
    title: 'Сміх крізь сльози',
    description: 'Родина збирається на весілля, яке пішло не за планом з першої хвилини.',
    durationMin: 104,
    ageRating: '12+',
    genres: ['Комедія', 'Драма'],
  },
  {
    title: 'Тихий будинок',
    description: 'Сімейна пара купує будинок за півціни і невдовзі розуміє, чому він такий дешевий.',
    durationMin: 109,
    ageRating: '18+',
    genres: ['Жахи', 'Трилер'],
  },
];

async function seedAdmin(prisma: PrismaService) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      name: 'Admin',
      passwordHash: await argon2.hash(password),
      role: 'ADMIN',
    },
  });
  console.log(`Admin ready: ${email}`);
}

async function seedGenres(prisma: PrismaService) {
  for (const name of GENRES) {
    await prisma.genre.upsert({ where: { name }, update: {}, create: { name } });
  }
  const genres = await prisma.genre.findMany();
  return new Map(genres.map((genre) => [genre.name, genre.id]));
}

async function seedHalls(prisma: PrismaService) {
  for (const hall of HALLS) {
    const exists = await prisma.hall.findUnique({
      where: { name: hall.name },
      select: { id: true },
    });
    if (exists) continue;

    const vipRows = new Set(hall.vipRows);
    const seats = Array.from({ length: hall.rows }, (_, rowIndex) => rowIndex + 1).flatMap((row) =>
      Array.from({ length: hall.seatsPerRow }, (_, numberIndex) => ({
        row,
        number: numberIndex + 1,
        type: vipRows.has(row) ? ('VIP' as const) : ('STANDARD' as const),
      })),
    );

    await prisma.hall.create({
      data: {
        name: hall.name,
        rows: hall.rows,
        seatsPerRow: hall.seatsPerRow,
        seats: { createMany: { data: seats } },
      },
    });
    console.log(`Hall created: ${hall.name} (${seats.length} seats)`);
  }

  return prisma.hall.findMany({ where: { name: { in: HALLS.map((hall) => hall.name) } } });
}

async function seedMovies(prisma: PrismaService, genreIds: Map<string, string>) {
  for (const movie of MOVIES) {
    const exists = await prisma.movie.findFirst({
      where: { title: movie.title },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.movie.create({
      data: {
        title: movie.title,
        description: movie.description,
        durationMin: movie.durationMin,
        ageRating: movie.ageRating,
        posterUrl: `https://placehold.co/400x600/png?text=${encodeURIComponent(movie.title)}`,
        releaseDate: new Date(),
        genres: {
          create: movie.genres.map((name) => ({ genreId: genreIds.get(name) as string })),
        },
      },
    });
    console.log(`Movie created: ${movie.title}`);
  }

  return prisma.movie.findMany({
    where: { title: { in: MOVIES.map((movie) => movie.title) } },
    select: { id: true, durationMin: true },
    orderBy: { title: 'asc' },
  });
}

async function seedSessions(
  prisma: PrismaService,
  halls: { id: string; name: string }[],
  movies: { id: string; durationMin: number }[],
) {
  if (movies.length === 0) return;

  for (const [hallIndex, hall] of halls.entries()) {
    const config = HALLS.find((item) => item.name === hall.name);
    if (!config) continue;

    const upcoming = await prisma.session.count({
      where: { hallId: hall.id, startAt: { gt: new Date() } },
    });
    if (upcoming > 0) continue;

    const sessions: {
      movieId: string;
      hallId: string;
      startAt: Date;
      endAt: Date;
      price: number;
      vipPrice: number;
    }[] = [];
    let movieIndex = hallIndex * 2;

    for (let day = 0; day < DAYS; day += 1) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() + day);
      dayStart.setHours(FIRST_START_HOUR, 0, 0, 0);

      const dayLimit = new Date(dayStart);
      dayLimit.setHours(LAST_END_HOUR, 0, 0, 0);

      let cursor = dayStart;
      while (cursor < dayLimit) {
        const movie = movies[movieIndex % movies.length];
        const endAt = new Date(cursor.getTime() + (movie.durationMin + BUFFER_MIN) * 60_000);
        if (endAt > dayLimit) break;

        if (cursor.getTime() > Date.now()) {
          sessions.push({
            movieId: movie.id,
            hallId: hall.id,
            startAt: cursor,
            endAt,
            price: config.price,
            vipPrice: config.vipPrice,
          });
        }

        movieIndex += 1;
        cursor = new Date(endAt.getTime() + GAP_MIN * 60_000);
      }
    }

    if (sessions.length === 0) continue;
    await prisma.session.createMany({ data: sessions });
    console.log(`Sessions created for ${hall.name}: ${sessions.length}`);
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);
    await seedAdmin(prisma);
    const genreIds = await seedGenres(prisma);
    const halls = await seedHalls(prisma);
    const movies = await seedMovies(prisma, genreIds);
    await seedSessions(prisma, halls, movies);
    console.log('Seed finished');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
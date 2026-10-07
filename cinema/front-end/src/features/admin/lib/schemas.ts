import { z } from 'zod';

const positiveInt = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label}: введіть ціле число`)
    .refine((value) => Number(value) > 0, `${label}: більше нуля`);

const price = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, 'Невалідна ціна');

const optionalPrice = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+([.,]\d{1,2})?$/.test(value), 'Невалідна ціна');

const isUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || isUrl(value), 'Невалідне посилання');

export const genreSchema = z.object({
  name: z.string().trim().min(1, 'Введіть назву').max(50, 'Максимум 50 символів'),
});

export const hallCreateSchema = z.object({
  name: z.string().trim().min(1, 'Введіть назву'),
  rows: positiveInt('Рядів'),
  seatsPerRow: positiveInt('Місць у ряду'),
  vipRows: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d+(\s*,\s*\d+)*$/.test(value),
      'Номери рядків через кому, наприклад 8, 9',
    ),
});

export const hallRenameSchema = z.object({
  name: z.string().trim().min(1, 'Введіть назву'),
});

export const movieSchema = z.object({
  title: z.string().trim().min(1, 'Введіть назву'),
  description: z.string().trim().min(1, 'Введіть опис'),
  durationMin: positiveInt('Тривалість'),
  ageRating: z.string().trim(),
  releaseDate: z.string(),
  posterUrl: optionalUrl,
  trailerUrl: optionalUrl,
  genreIds: z.array(z.string()),
});

export const sessionSchema = z.object({
  movieId: z.string().min(1, 'Оберіть фільм'),
  hallId: z.string().min(1, 'Оберіть зал'),
  startAt: z.string().min(1, 'Вкажіть дату і час'),
  price,
  vipPrice: optionalPrice,
});

export type GenreFormValues = z.infer<typeof genreSchema>;
export type HallCreateFormValues = z.infer<typeof hallCreateSchema>;
export type HallRenameFormValues = z.infer<typeof hallRenameSchema>;
export type MovieFormValues = z.infer<typeof movieSchema>;
export type SessionFormValues = z.infer<typeof sessionSchema>;

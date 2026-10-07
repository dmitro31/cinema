import type {
  Genre,
  HallPayload,
  Movie,
  MoviePayload,
  Session,
  SessionPayload,
} from '../catalog-types';
import { toNumber } from './format';
import { toDateInput } from './date-range';
import type {
  HallCreateFormValues,
  MovieFormValues,
  SessionFormValues,
} from './schemas';

const pad = (value: number) => String(value).padStart(2, '0');

export function toDateTimeLocal(iso: string) {
  const date = new Date(iso);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const parsePrice = (value: string) => Number(value.replace(',', '.'));

const orUndefined = (value: string) => (value === '' ? undefined : value);

export const movieGenres = (movie: Movie): Genre[] =>
  (movie.genres ?? []).map((link) => ('genre' in link ? link.genre : link));

export const emptyMovieForm: MovieFormValues = {
  title: '',
  description: '',
  durationMin: '',
  ageRating: '',
  releaseDate: '',
  posterUrl: '',
  trailerUrl: '',
  genreIds: [],
};

export const movieToForm = (movie: Movie): MovieFormValues => ({
  title: movie.title,
  description: movie.description,
  durationMin: String(movie.durationMin),
  ageRating: movie.ageRating ?? '',
  releaseDate: movie.releaseDate ? toDateInput(movie.releaseDate) : '',
  posterUrl: movie.posterUrl ?? '',
  trailerUrl: movie.trailerUrl ?? '',
  genreIds: movieGenres(movie).map((genre) => genre.id),
});

export const toMoviePayload = (values: MovieFormValues): MoviePayload => ({
  title: values.title,
  description: values.description,
  durationMin: Number(values.durationMin),
  ageRating: orUndefined(values.ageRating),
  posterUrl: orUndefined(values.posterUrl),
  trailerUrl: orUndefined(values.trailerUrl),
  releaseDate: values.releaseDate
    ? new Date(`${values.releaseDate}T00:00:00`).toISOString()
    : undefined,
  genreIds: values.genreIds,
});

export const emptySessionForm: SessionFormValues = {
  movieId: '',
  hallId: '',
  startAt: '',
  price: '',
  vipPrice: '',
};

export const sessionToForm = (session: Session): SessionFormValues => ({
  movieId: session.movieId,
  hallId: session.hallId,
  startAt: toDateTimeLocal(session.startAt),
  price: String(toNumber(session.price)),
  vipPrice: session.vipPrice === null ? '' : String(toNumber(session.vipPrice)),
});

export const toSessionPayload = (values: SessionFormValues): SessionPayload => ({
  movieId: values.movieId,
  hallId: values.hallId,
  startAt: new Date(values.startAt).toISOString(),
  price: parsePrice(values.price),
  vipPrice: values.vipPrice === '' ? undefined : parsePrice(values.vipPrice),
});

export const toHallPayload = (values: HallCreateFormValues): HallPayload => {
  const vipRows = values.vipRows
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);

  return {
    name: values.name,
    rows: Number(values.rows),
    seatsPerRow: Number(values.seatsPerRow),
    vipRows: vipRows.length > 0 ? vipRows : undefined,
  };
};

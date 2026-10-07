'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Movie } from '../catalog-types';
import { useGenres, useMovieMutations } from '../hooks/use-catalog';
import { emptyMovieForm, movieToForm, toMoviePayload } from '../lib/catalog';
import { movieSchema, type MovieFormValues } from '../lib/schemas';
import {
  Field,
  FormActions,
  FormError,
  TextArea,
  TextInput,
} from './fields';
import { GenrePicker } from './GenrePicker';

export function MovieForm({
  movie,
  onDone,
}: {
  movie?: Movie;
  onDone: () => void;
}) {
  const { create, update } = useMovieMutations();
  const genres = useGenres();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: movie ? movieToForm(movie) : emptyMovieForm,
  });

  const onSubmit = async (values: MovieFormValues) => {
    setServerError(null);

    try {
      const payload = toMoviePayload(values);

      if (movie) {
        await update.mutateAsync({ id: movie.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }

      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Не вдалося зберегти фільм.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Назва" htmlFor="movie-title" error={errors.title?.message}>
        <TextInput
          id="movie-title"
          autoFocus
          placeholder="Остання станція"
          error={!!errors.title}
          {...register('title')}
        />
      </Field>

      <Field label="Опис" htmlFor="movie-description" error={errors.description?.message}>
        <TextArea
          id="movie-description"
          placeholder="Короткий сюжет фільму"
          error={!!errors.description}
          {...register('description')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Тривалість, хв"
          htmlFor="movie-duration"
          error={errors.durationMin?.message}
        >
          <TextInput
            id="movie-duration"
            inputMode="numeric"
            placeholder="128"
            error={!!errors.durationMin}
            {...register('durationMin')}
          />
        </Field>

        <Field label="Вік" htmlFor="movie-age" error={errors.ageRating?.message}>
          <TextInput
            id="movie-age"
            placeholder="16+"
            error={!!errors.ageRating}
            {...register('ageRating')}
          />
        </Field>

        <Field
          label="Прем’єра"
          htmlFor="movie-release"
          error={errors.releaseDate?.message}
        >
          <TextInput
            id="movie-release"
            type="date"
            error={!!errors.releaseDate}
            {...register('releaseDate')}
          />
        </Field>
      </div>

      <Field label="Постер (URL)" htmlFor="movie-poster" error={errors.posterUrl?.message}>
        <TextInput
          id="movie-poster"
          placeholder="https://..."
          error={!!errors.posterUrl}
          {...register('posterUrl')}
        />
      </Field>

      <Field label="Трейлер (URL)" htmlFor="movie-trailer" error={errors.trailerUrl?.message}>
        <TextInput
          id="movie-trailer"
          placeholder="https://www.youtube.com/watch?v=..."
          error={!!errors.trailerUrl}
          {...register('trailerUrl')}
        />
      </Field>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[#D8D8E0]">Жанри</p>

        {genres.isPending ? (
          <p className="text-sm text-[#6F6F7C]">Завантаження жанрів...</p>
        ) : (
          <Controller
            control={control}
            name="genreIds"
            render={({ field }) => (
              <GenrePicker
                genres={genres.data ?? []}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </div>

      {serverError && <FormError>{serverError}</FormError>}

      <FormActions
        onCancel={onDone}
        submitting={isSubmitting}
        submitLabel={movie ? 'Зберегти' : 'Створити фільм'}
      />
    </form>
  );
}

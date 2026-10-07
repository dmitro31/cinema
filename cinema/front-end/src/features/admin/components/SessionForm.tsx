'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Session } from '../catalog-types';
import {
  useHalls,
  useMovieOptions,
  useSessionMutations,
} from '../hooks/use-catalog';
import {
  emptySessionForm,
  sessionToForm,
  toSessionPayload,
} from '../lib/catalog';
import { formatDuration } from '../lib/format';
import { sessionSchema, type SessionFormValues } from '../lib/schemas';
import {
  Field,
  FormActions,
  FormError,
  SelectInput,
  TextInput,
} from './fields';

export function SessionForm({
  session,
  onDone,
}: {
  session?: Session;
  onDone: () => void;
}) {
  const { create, update } = useSessionMutations();
  const movies = useMovieOptions();
  const halls = useHalls();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: session ? sessionToForm(session) : emptySessionForm,
  });

  const movieId = useWatch({ control, name: 'movieId' });
  const selectedMovie = movies.data?.find((movie) => movie.id === movieId);

  const onSubmit = async (values: SessionFormValues) => {
    setServerError(null);

    try {
      const payload = toSessionPayload(values);

      if (session) {
        await update.mutateAsync({ id: session.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }

      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Не вдалося зберегти сеанс.'));
    }
  };

  const noMovies = movies.isSuccess && movies.data.length === 0;
  const noHalls = halls.isSuccess && halls.data.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field
        label="Фільм"
        htmlFor="session-movie"
        error={errors.movieId?.message}
        hint={
          selectedMovie
            ? `Тривалість: ${formatDuration(selectedMovie.durationMin)}`
            : noMovies
              ? 'Спочатку додайте фільм'
              : undefined
        }
      >
        <SelectInput
          id="session-movie"
          error={!!errors.movieId}
          disabled={movies.isPending}
          {...register('movieId')}
        >
          <option value="">Оберіть фільм</option>
          {movies.data?.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field
        label="Зал"
        htmlFor="session-hall"
        error={errors.hallId?.message}
        hint={noHalls ? 'Спочатку створіть зал' : undefined}
      >
        <SelectInput
          id="session-hall"
          error={!!errors.hallId}
          disabled={halls.isPending}
          {...register('hallId')}
        >
          <option value="">Оберіть зал</option>
          {halls.data?.map((hall) => (
            <option key={hall.id} value={hall.id}>
              {hall.name}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field
        label="Початок"
        htmlFor="session-start"
        error={errors.startAt?.message}
        hint="Час завершення сервер розрахує за тривалістю фільму"
      >
        <TextInput
          id="session-start"
          type="datetime-local"
          error={!!errors.startAt}
          {...register('startAt')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ціна, грн" htmlFor="session-price" error={errors.price?.message}>
          <TextInput
            id="session-price"
            inputMode="decimal"
            placeholder="120"
            error={!!errors.price}
            {...register('price')}
          />
        </Field>

        <Field
          label="Ціна VIP, грн"
          htmlFor="session-vip"
          error={errors.vipPrice?.message}
        >
          <TextInput
            id="session-vip"
            inputMode="decimal"
            placeholder="200"
            error={!!errors.vipPrice}
            {...register('vipPrice')}
          />
        </Field>
      </div>

      {serverError && <FormError>{serverError}</FormError>}

      <FormActions
        onCancel={onDone}
        submitting={isSubmitting}
        submitLabel={session ? 'Зберегти' : 'Створити сеанс'}
      />
    </form>
  );
}

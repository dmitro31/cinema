'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Genre } from '../catalog-types';
import { useGenreMutations } from '../hooks/use-catalog';
import { genreSchema, type GenreFormValues } from '../lib/schemas';
import { Field, FormActions, FormError, TextInput } from './fields';

export function GenreForm({
  genre,
  onDone,
}: {
  genre?: Genre;
  onDone: () => void;
}) {
  const { create, update } = useGenreMutations();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenreFormValues>({
    resolver: zodResolver(genreSchema),
    defaultValues: { name: genre?.name ?? '' },
  });

  const onSubmit = async (values: GenreFormValues) => {
    setServerError(null);

    try {
      if (genre) {
        await update.mutateAsync({ id: genre.id, input: values });
      } else {
        await create.mutateAsync(values);
      }

      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Не вдалося зберегти жанр.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Назва" htmlFor="genre-name" error={errors.name?.message}>
        <TextInput
          id="genre-name"
          autoFocus
          placeholder="Бойовик"
          error={!!errors.name}
          {...register('name')}
        />
      </Field>

      {serverError && <FormError>{serverError}</FormError>}

      <FormActions
        onCancel={onDone}
        submitting={isSubmitting}
        submitLabel={genre ? 'Зберегти' : 'Створити'}
      />
    </form>
  );
}

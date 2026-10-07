'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Hall } from '../catalog-types';
import { useHallMutations } from '../hooks/use-catalog';
import { toHallPayload } from '../lib/catalog';
import { formatNumber } from '../lib/format';
import {
  hallCreateSchema,
  hallRenameSchema,
  type HallCreateFormValues,
  type HallRenameFormValues,
} from '../lib/schemas';
import { Field, FormActions, FormError, TextInput } from './fields';

function HallRenameForm({ hall, onDone }: { hall: Hall; onDone: () => void }) {
  const { update } = useHallMutations();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HallRenameFormValues>({
    resolver: zodResolver(hallRenameSchema),
    defaultValues: { name: hall.name },
  });

  const onSubmit = async (values: HallRenameFormValues) => {
    setServerError(null);

    try {
      await update.mutateAsync({ id: hall.id, input: values });
      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Не вдалося перейменувати зал.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Назва" htmlFor="hall-name" error={errors.name?.message}>
        <TextInput
          id="hall-name"
          autoFocus
          error={!!errors.name}
          {...register('name')}
        />
      </Field>

      <p className="text-xs text-[#6F6F7C]">
        Розмір залу змінити не можна: місця вже прив’язані до квитків.
      </p>

      {serverError && <FormError>{serverError}</FormError>}

      <FormActions onCancel={onDone} submitting={isSubmitting} submitLabel="Зберегти" />
    </form>
  );
}

function HallCreateForm({ onDone }: { onDone: () => void }) {
  const { create } = useHallMutations();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HallCreateFormValues>({
    resolver: zodResolver(hallCreateSchema),
    defaultValues: { name: '', rows: '', seatsPerRow: '', vipRows: '' },
  });

  const [rows, seatsPerRow] = useWatch({ control, name: ['rows', 'seatsPerRow'] });
  const total = Number(rows) * Number(seatsPerRow);

  const onSubmit = async (values: HallCreateFormValues) => {
    setServerError(null);

    try {
      await create.mutateAsync(toHallPayload(values));
      onDone();
    } catch (error) {
      setServerError(getErrorMessage(error, 'Не вдалося створити зал.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Назва" htmlFor="hall-name" error={errors.name?.message}>
        <TextInput
          id="hall-name"
          autoFocus
          placeholder="Зал 1"
          error={!!errors.name}
          {...register('name')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Рядів" htmlFor="hall-rows" error={errors.rows?.message}>
          <TextInput
            id="hall-rows"
            inputMode="numeric"
            placeholder="8"
            error={!!errors.rows}
            {...register('rows')}
          />
        </Field>

        <Field
          label="Місць у ряду"
          htmlFor="hall-seats"
          error={errors.seatsPerRow?.message}
        >
          <TextInput
            id="hall-seats"
            inputMode="numeric"
            placeholder="10"
            error={!!errors.seatsPerRow}
            {...register('seatsPerRow')}
          />
        </Field>
      </div>

      <Field
        label="VIP-ряди"
        htmlFor="hall-vip"
        error={errors.vipRows?.message}
        hint="Необов’язково. Номери рядків через кому, наприклад 8, 9"
      >
        <TextInput
          id="hall-vip"
          placeholder="8, 9"
          error={!!errors.vipRows}
          {...register('vipRows')}
        />
      </Field>

      {Number.isFinite(total) && total > 0 && (
        <p className="text-sm text-[#9A9AA8]">
          Усього місць: <span className="font-medium text-[#F4F4F5]">{formatNumber(total)}</span>
        </p>
      )}

      {serverError && <FormError>{serverError}</FormError>}

      <FormActions onCancel={onDone} submitting={isSubmitting} submitLabel="Створити зал" />
    </form>
  );
}

export function HallForm({ hall, onDone }: { hall?: Hall; onDone: () => void }) {
  return hall ? (
    <HallRenameForm hall={hall} onDone={onDone} />
  ) : (
    <HallCreateForm onDone={onDone} />
  );
}

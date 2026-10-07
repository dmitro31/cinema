'use client';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Genre } from '../catalog-types';
import { useGenreMutations, useGenres } from '../hooks/use-catalog';
import { useEntityDialogs } from '../hooks/use-entity-dialogs';
import { ConfirmDialog, Modal } from './dialogs';
import { TableSkeleton } from './DataTable';
import { PrimaryButton } from './fields';
import { GenreForm } from './GenreForm';
import { PlusIcon } from './icons';
import { RowActions } from './RowActions';
import { EmptyState, ErrorState, PageHeader, Panel } from './ui';

export function GenresView() {
  const genres = useGenres();
  const { remove } = useGenreMutations();
  const dialogs = useEntityDialogs<Genre>();

  const confirmDelete = async () => {
    if (!dialogs.deleting) return;

    try {
      await remove.mutateAsync(dialogs.deleting.id);
      dialogs.finishDelete();
    } catch (error) {
      dialogs.failDelete(getErrorMessage(error, 'Не вдалося видалити жанр.'));
    }
  };

  return (
    <>
      <PageHeader
        title="Жанри"
        description={genres.data ? `Усього: ${genres.data.length}` : 'Жанри фільмів'}
        actions={
          <PrimaryButton onClick={dialogs.openCreate}>
            <PlusIcon className="h-4 w-4" />
            Додати жанр
          </PrimaryButton>
        }
      />

      <Panel>
        {genres.isPending ? (
          <TableSkeleton rows={5} />
        ) : genres.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(genres.error, 'Не вдалося завантажити жанри.')}
              onRetry={() => void genres.refetch()}
            />
          </div>
        ) : genres.data.length === 0 ? (
          <EmptyState
            title="Жанрів ще немає"
            description="Створіть перший жанр, щоб призначати його фільмам."
          />
        ) : (
          <ul className="divide-y divide-[#1E1E28]">
            {genres.data.map((genre) => (
              <li
                key={genre.id}
                className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-white/[0.02]"
              >
                <span className="font-medium text-[#F4F4F5]">{genre.name}</span>

                <RowActions
                  onEdit={() => dialogs.openEdit(genre)}
                  onDelete={() => dialogs.askDelete(genre)}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={dialogs.isFormOpen}
        title={dialogs.editing ? 'Редагувати жанр' : 'Новий жанр'}
        onClose={dialogs.closeForm}
      >
        <GenreForm genre={dialogs.editing} onDone={dialogs.closeForm} />
      </Modal>

      <ConfirmDialog
        open={dialogs.deleting !== null}
        title="Видалити жанр?"
        description={`Жанр «${dialogs.deleting?.name ?? ''}» буде видалено. Фільми залишаться, але втратять цей жанр.`}
        loading={remove.isPending}
        error={dialogs.deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={dialogs.cancelDelete}
      />
    </>
  );
}

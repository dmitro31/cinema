'use client';

import { useState } from 'react';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Movie } from '../catalog-types';
import { useMovieMutations, useMovies } from '../hooks/use-catalog';
import { useEntityDialogs } from '../hooks/use-entity-dialogs';
import { movieGenres } from '../lib/catalog';
import { formatDate, formatDuration, formatNumber } from '../lib/format';
import { ConfirmDialog, Modal } from './dialogs';
import { DataTable, TableSkeleton, type Column } from './DataTable';
import { PrimaryButton } from './fields';
import { PlusIcon } from './icons';
import { MovieForm } from './MovieForm';
import { Pagination } from './Pagination';
import { RowActions } from './RowActions';
import { EmptyState, ErrorState, PageHeader, Panel } from './ui';

export function MoviesView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const movies = useMovies({ page, limit });
  const { remove } = useMovieMutations();
  const dialogs = useEntityDialogs<Movie>();

  const confirmDelete = async () => {
    if (!dialogs.deleting) return;

    try {
      await remove.mutateAsync(dialogs.deleting.id);
      dialogs.finishDelete();
    } catch (error) {
      dialogs.failDelete(getErrorMessage(error, 'Не вдалося видалити фільм.'));
    }
  };

  const columns: Column<Movie>[] = [
    {
      key: 'movie',
      header: 'Фільм',
      cell: (movie) => (
        <div className="flex items-center gap-3">
          <div
            role="img"
            aria-label={`Постер: ${movie.title}`}
            className="h-14 w-10 shrink-0 rounded-md bg-[#1B1B25] bg-cover bg-center"
            style={
              movie.posterUrl
                ? { backgroundImage: `url(${JSON.stringify(movie.posterUrl)})` }
                : undefined
            }
          />

          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium text-[#F4F4F5]">{movie.title}</p>

            {movie.ageRating && (
              <p className="mt-0.5 text-xs text-[#6F6F7C]">{movie.ageRating}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'genres',
      header: 'Жанри',
      cell: (movie) => {
        const genres = movieGenres(movie);

        return genres.length === 0 ? (
          '—'
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <span
                key={genre.id}
                className="rounded-full border border-[#2B2B37] bg-[#17171F] px-2.5 py-0.5 text-xs text-[#D8D8E0]"
              >
                {genre.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'duration',
      header: 'Тривалість',
      cell: (movie) => (
        <span className="whitespace-nowrap">{formatDuration(movie.durationMin)}</span>
      ),
    },
    {
      key: 'release',
      header: 'Прем’єра',
      cell: (movie) => (movie.releaseDate ? formatDate(movie.releaseDate) : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (movie) => (
        <RowActions
          onEdit={() => dialogs.openEdit(movie)}
          onDelete={() => dialogs.askDelete(movie)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Фільми"
        description={movies.data ? `Усього: ${formatNumber(movies.data.total)}` : 'Афіша кінотеатру'}
        actions={
          <PrimaryButton onClick={dialogs.openCreate}>
            <PlusIcon className="h-4 w-4" />
            Додати фільм
          </PrimaryButton>
        }
      />

      <Panel>
        {movies.isPending ? (
          <TableSkeleton />
        ) : movies.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(movies.error, 'Не вдалося завантажити фільми.')}
              onRetry={() => void movies.refetch()}
            />
          </div>
        ) : movies.data.items.length === 0 ? (
          <EmptyState
            title="Фільмів ще немає"
            description="Додайте перший фільм до афіші."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={movies.data.items}
              getKey={(movie) => movie.id}
              dimmed={movies.isPlaceholderData}
              minWidth={720}
            />

            <Pagination
              page={page}
              limit={limit}
              total={movies.data.total}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          </>
        )}
      </Panel>

      <Modal
        open={dialogs.isFormOpen}
        title={dialogs.editing ? 'Редагувати фільм' : 'Новий фільм'}
        size="lg"
        onClose={dialogs.closeForm}
      >
        <MovieForm movie={dialogs.editing} onDone={dialogs.closeForm} />
      </Modal>

      <ConfirmDialog
        open={dialogs.deleting !== null}
        title="Видалити фільм?"
        description={`Фільм «${dialogs.deleting?.title ?? ''}» буде видалено. Якщо для нього є сеанси, видалення буде відхилено.`}
        loading={remove.isPending}
        error={dialogs.deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={dialogs.cancelDelete}
      />
    </>
  );
}

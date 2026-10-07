'use client';

import { useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Session } from '../catalog-types';
import {
  useHalls,
  useMovieOptions,
  useSessionMutations,
  useSessions,
} from '../hooks/use-catalog';
import { useEntityDialogs } from '../hooks/use-entity-dialogs';
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatTime,
  shortId,
} from '../lib/format';
import { ConfirmDialog, Modal } from './dialogs';
import { DataTable, TableSkeleton, type Column } from './DataTable';
import { PrimaryButton } from './fields';
import { PlusIcon } from './icons';
import { Pagination } from './Pagination';
import { RowActions } from './RowActions';
import { SessionForm } from './SessionForm';
import { EmptyState, ErrorState, PageHeader, Panel } from './ui';

export function SessionsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const sessions = useSessions({ page, limit });
  const movies = useMovieOptions();
  const halls = useHalls();
  const { remove } = useSessionMutations();
  const dialogs = useEntityDialogs<Session>();

  const movieTitles = useMemo(
    () => new Map(movies.data?.map((movie) => [movie.id, movie.title])),
    [movies.data],
  );
  const hallNames = useMemo(
    () => new Map(halls.data?.map((hall) => [hall.id, hall.name])),
    [halls.data],
  );

  const confirmDelete = async () => {
    if (!dialogs.deleting) return;

    try {
      await remove.mutateAsync(dialogs.deleting.id);
      dialogs.finishDelete();
    } catch (error) {
      dialogs.failDelete(getErrorMessage(error, 'Не вдалося видалити сеанс.'));
    }
  };

  const columns: Column<Session>[] = [
    {
      key: 'movie',
      header: 'Фільм',
      cell: (session) => (
        <span className="font-medium text-[#F4F4F5]">
          {session.movie?.title ??
            movieTitles.get(session.movieId) ??
            `#${shortId(session.movieId)}`}
        </span>
      ),
    },
    {
      key: 'hall',
      header: 'Зал',
      cell: (session) =>
        session.hall?.name ??
        hallNames.get(session.hallId) ??
        `#${shortId(session.hallId)}`,
    },
    {
      key: 'time',
      header: 'Час',
      cell: (session) => (
        <>
          <p className="whitespace-nowrap text-[#F4F4F5]">{formatDate(session.startAt)}</p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-[#6F6F7C]">
            {formatTime(session.startAt)} – {formatTime(session.endAt)}
          </p>
        </>
      ),
    },
    {
      key: 'price',
      header: 'Ціна',
      align: 'right',
      cell: (session) => (
        <>
          <p className="text-[#F4F4F5]">{formatMoney(session.price)}</p>
          <p className="mt-0.5 text-xs text-[#6F6F7C]">
            VIP: {session.vipPrice == null ? '—' : formatMoney(session.vipPrice)}
          </p>
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (session) => (
        <RowActions
          onEdit={() => dialogs.openEdit(session)}
          onDelete={() => dialogs.askDelete(session)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Сеанси"
        description={sessions.data ? `Усього: ${formatNumber(sessions.data.total)}` : 'Розклад показів'}
        actions={
          <PrimaryButton onClick={dialogs.openCreate}>
            <PlusIcon className="h-4 w-4" />
            Додати сеанс
          </PrimaryButton>
        }
      />

      <Panel>
        {sessions.isPending ? (
          <TableSkeleton />
        ) : sessions.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(sessions.error, 'Не вдалося завантажити сеанси.')}
              onRetry={() => void sessions.refetch()}
            />
          </div>
        ) : sessions.data.items.length === 0 ? (
          <EmptyState
            title="Сеансів ще немає"
            description="Додайте перший сеанс до розкладу."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={sessions.data.items}
              getKey={(session) => session.id}
              dimmed={sessions.isPlaceholderData}
              minWidth={680}
            />

            <Pagination
              page={page}
              limit={limit}
              total={sessions.data.total}
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
        title={dialogs.editing ? 'Редагувати сеанс' : 'Новий сеанс'}
        onClose={dialogs.closeForm}
      >
        <SessionForm session={dialogs.editing} onDone={dialogs.closeForm} />
      </Modal>

      <ConfirmDialog
        open={dialogs.deleting !== null}
        title="Видалити сеанс?"
        description="Сеанс буде видалено з розкладу. Якщо на нього вже є замовлення або квитки, видалення буде відхилено."
        loading={remove.isPending}
        error={dialogs.deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={dialogs.cancelDelete}
      />
    </>
  );
}

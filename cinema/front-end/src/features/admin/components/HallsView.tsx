'use client';

import { getErrorMessage } from '@/lib/get-error-message';

import type { Hall } from '../catalog-types';
import { useHallMutations, useHalls } from '../hooks/use-catalog';
import { useEntityDialogs } from '../hooks/use-entity-dialogs';
import { formatDate, formatNumber } from '../lib/format';
import { ConfirmDialog, Modal } from './dialogs';
import { DataTable, TableSkeleton, type Column } from './DataTable';
import { PrimaryButton } from './fields';
import { HallForm } from './HallForm';
import { PlusIcon } from './icons';
import { RowActions } from './RowActions';
import { EmptyState, ErrorState, PageHeader, Panel } from './ui';

export function HallsView() {
  const halls = useHalls();
  const { remove } = useHallMutations();
  const dialogs = useEntityDialogs<Hall>();

  const confirmDelete = async () => {
    if (!dialogs.deleting) return;

    try {
      await remove.mutateAsync(dialogs.deleting.id);
      dialogs.finishDelete();
    } catch (error) {
      dialogs.failDelete(getErrorMessage(error, 'Не вдалося видалити зал.'));
    }
  };

  const columns: Column<Hall>[] = [
    {
      key: 'name',
      header: 'Назва',
      cell: (hall) => <span className="font-medium text-[#F4F4F5]">{hall.name}</span>,
    },
    {
      key: 'layout',
      header: 'Схема',
      cell: (hall) => `${hall.rows} рядів × ${hall.seatsPerRow} місць`,
    },
    {
      key: 'seats',
      header: 'Місць',
      align: 'right',
      cell: (hall) => formatNumber(hall.rows * hall.seatsPerRow),
    },
    {
      key: 'created',
      header: 'Створено',
      cell: (hall) => (hall.createdAt ? formatDate(hall.createdAt) : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (hall) => (
        <RowActions
          editLabel="Перейменувати"
          onEdit={() => dialogs.openEdit(hall)}
          onDelete={() => dialogs.askDelete(hall)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Зали"
        description={halls.data ? `Усього: ${halls.data.length}` : 'Зали кінотеатру'}
        actions={
          <PrimaryButton onClick={dialogs.openCreate}>
            <PlusIcon className="h-4 w-4" />
            Додати зал
          </PrimaryButton>
        }
      />

      <Panel>
        {halls.isPending ? (
          <TableSkeleton rows={4} />
        ) : halls.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(halls.error, 'Не вдалося завантажити зали.')}
              onRetry={() => void halls.refetch()}
            />
          </div>
        ) : halls.data.length === 0 ? (
          <EmptyState
            title="Залів ще немає"
            description="Створіть зал: місця згенеруються автоматично."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={halls.data}
            getKey={(hall) => hall.id}
            minWidth={640}
          />
        )}
      </Panel>

      <Modal
        open={dialogs.isFormOpen}
        title={dialogs.editing ? 'Перейменувати зал' : 'Новий зал'}
        onClose={dialogs.closeForm}
      >
        <HallForm hall={dialogs.editing} onDone={dialogs.closeForm} />
      </Modal>

      <ConfirmDialog
        open={dialogs.deleting !== null}
        title="Видалити зал?"
        description={`Зал «${dialogs.deleting?.name ?? ''}» і всі його місця буде видалено. Якщо в залі є сеанси, видалення буде відхилено.`}
        loading={remove.isPending}
        error={dialogs.deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={dialogs.cancelDelete}
      />
    </>
  );
}

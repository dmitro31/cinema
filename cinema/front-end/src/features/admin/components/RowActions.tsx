import type { ReactNode } from 'react';

import { EditIcon, TrashIcon } from './icons';

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#9A9AA8] transition hover:bg-white/5 ${
        danger ? 'hover:text-[#FF7A7A]' : 'hover:text-[#F4F4F5]'
      }`}
    >
      {children}
    </button>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  editLabel = 'Редагувати',
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <IconButton label={editLabel} onClick={onEdit}>
        <EditIcon className="h-4 w-4" />
      </IconButton>

      <IconButton label="Видалити" onClick={onDelete} danger>
        <TrashIcon className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

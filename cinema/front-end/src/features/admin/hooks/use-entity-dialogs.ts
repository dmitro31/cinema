'use client';

import { useState } from 'react';

export function useEntityDialogs<T>() {
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return {
    isFormOpen: editing !== null,
    editing: editing !== null && editing !== 'new' ? editing : undefined,
    openCreate: () => setEditing('new'),
    openEdit: (item: T) => setEditing(item),
    closeForm: () => setEditing(null),
    deleting,
    deleteError,
    askDelete: (item: T) => {
      setDeleteError(null);
      setDeleting(item);
    },
    cancelDelete: () => {
      setDeleting(null);
      setDeleteError(null);
    },
    failDelete: (message: string) => setDeleteError(message),
    finishDelete: () => setDeleting(null),
  };
}

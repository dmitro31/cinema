'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { DangerButton, FormError, SecondaryButton } from './fields';
import { CrossIcon } from './icons';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = 'md',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-[#262631] bg-[#121218] p-0 text-[#F4F4F5] shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm ${
        size === 'lg' ? 'max-w-2xl' : 'max-w-md'
      }`}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#F4F4F5]">{title}</h2>

              {description && (
                <p className="mt-1 text-sm text-[#9A9AA8]">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9A9AA8] transition hover:bg-white/5 hover:text-[#F4F4F5]"
            >
              <CrossIcon className="h-4 w-4" />
            </button>
          </div>

          {children}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Видалити',
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm leading-6 text-[#9A9AA8]">{description}</p>

      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton onClick={onCancel}>Скасувати</SecondaryButton>

        <DangerButton loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </DangerButton>
      </div>
    </Modal>
  );
}

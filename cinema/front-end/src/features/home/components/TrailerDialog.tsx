'use client';

import { useEffect, useRef } from 'react';

import { CloseIcon } from '@/features/site/components/icons';

interface TrailerDialogProps {
  title: string;
  embedUrl: string | null;
  onClose: () => void;
}

export function TrailerDialog({ title, embedUrl, onClose }: TrailerDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = embedUrl !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={`Трейлер: ${title}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(1000px,calc(100vw-24px))] overflow-visible border border-[#2A2A2A] bg-black p-0 text-white backdrop:bg-black/90"
    >
      {embedUrl && (
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            title={`Трейлер: ${title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      <button
        type="button"
        aria-label="Закрити трейлер"
        onClick={onClose}
        className="absolute -top-12 right-0 flex size-10 items-center justify-center text-white outline-none transition hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
      >
        <CloseIcon />
      </button>
    </dialog>
  );
}

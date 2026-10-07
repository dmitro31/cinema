import type { Genre } from '../catalog-types';
import { CheckIcon } from './icons';

interface GenrePickerProps {
  genres: Genre[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function GenrePicker({ genres, value, onChange }: GenrePickerProps) {
  if (genres.length === 0) {
    return <p className="text-sm text-[#6F6F7C]">Спочатку створіть жанри.</p>;
  }

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const active = value.includes(genre.id);

        return (
          <button
            key={genre.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(genre.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition ${
              active
                ? 'border-[#F2B544] bg-[#F2B544]/10 text-[#F2B544]'
                : 'border-[#262631] text-[#9A9AA8] hover:bg-white/5 hover:text-[#F4F4F5]'
            }`}
          >
            {active && <CheckIcon className="h-3.5 w-3.5" />}
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}

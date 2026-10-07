'use client';

import { useRef, useState, type FormEvent } from 'react';

import { getErrorMessage } from '@/lib/get-error-message';

import { useValidateTicket } from '../hooks/use-catalog';
import { formatDateTime } from '../lib/format';
import { describeTicket, type TicketDetails } from '../lib/ticket';
import { STATUS_COLORS } from '../lib/theme';
import { PrimaryButton, TextInput } from './fields';
import { CheckIcon, CrossIcon, ScanIcon } from './icons';
import { PageHeader, Panel } from './ui';

interface ScanEntry {
  id: number;
  code: string;
  ok: boolean;
  message: string;
  details: TicketDetails;
  at: Date;
}

const HISTORY_SIZE = 8;

const timeFormatter = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function TicketValidatorView() {
  const validate = useValidateTicket();
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const [code, setCode] = useState('');
  const [history, setHistory] = useState<ScanEntry[]>([]);

  const last = history[0];

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const value = code.trim();
    if (!value) return;

    counter.current += 1;
    const id = counter.current;
    let entry: ScanEntry;

    try {
      const data = await validate.mutateAsync(value);

      entry = {
        id,
        code: value,
        ok: true,
        message: 'Квиток дійсний',
        details: describeTicket(data),
        at: new Date(),
      };
    } catch (error) {
      entry = {
        id,
        code: value,
        ok: false,
        message: getErrorMessage(error, 'Квиток недійсний'),
        details: {},
        at: new Date(),
      };
    }

    setHistory((prev) => [entry, ...prev].slice(0, HISTORY_SIZE));
    setCode('');
    inputRef.current?.focus();
  };

  const tone = last?.ok ? STATUS_COLORS.success : STATUS_COLORS.danger;
  const ResultIcon = last?.ok ? CheckIcon : CrossIcon;

  return (
    <>
      <PageHeader
        title="Перевірка квитків"
        description="Скануйте QR-код на вході або введіть код вручну"
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Panel className="p-6 sm:p-8">
            <form onSubmit={submit} className="space-y-4">
              <label
                htmlFor="ticket-code"
                className="flex items-center gap-2 text-sm font-medium text-[#D8D8E0]"
              >
                <ScanIcon className="h-4 w-4 text-[#F2B544]" />
                Код квитка
              </label>

              <TextInput
                id="ticket-code"
                ref={inputRef}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Код з QR або штрихкодовий сканер"
                className="h-14 font-mono text-base"
              />

              <PrimaryButton
                type="submit"
                loading={validate.isPending}
                loadingText="Перевірка..."
                disabled={code.trim() === ''}
                className="h-12 w-full"
              >
                Перевірити квиток
              </PrimaryButton>
            </form>
          </Panel>

          <div aria-live="polite">
            {last && (
              <Panel className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: tone, color: tone, background: `${tone}1A` }}
                  >
                    <ResultIcon className="h-6 w-6" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-[#F4F4F5]">{last.message}</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#6F6F7C]">{last.code}</p>

                    {last.ok && (
                      <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                        {last.details.movie && (
                          <div>
                            <dt className="text-xs text-[#6F6F7C]">Фільм</dt>
                            <dd className="mt-0.5 text-[#F4F4F5]">{last.details.movie}</dd>
                          </div>
                        )}

                        {last.details.startAt && (
                          <div>
                            <dt className="text-xs text-[#6F6F7C]">Початок</dt>
                            <dd className="mt-0.5 text-[#F4F4F5]">
                              {formatDateTime(last.details.startAt)}
                            </dd>
                          </div>
                        )}

                        {last.details.hall && (
                          <div>
                            <dt className="text-xs text-[#6F6F7C]">Зал</dt>
                            <dd className="mt-0.5 text-[#F4F4F5]">{last.details.hall}</dd>
                          </div>
                        )}

                        {last.details.seat && (
                          <div>
                            <dt className="text-xs text-[#6F6F7C]">Місце</dt>
                            <dd className="mt-0.5 text-[#F4F4F5]">{last.details.seat}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>

        <Panel className="h-fit p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-[#F4F4F5]">Останні перевірки</h2>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-[#6F6F7C]">Поки що нічого не скановано.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#1E1E28]">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-3">
                  {entry.ok ? (
                    <CheckIcon
                      className="h-4 w-4 shrink-0"
                      style={{ color: STATUS_COLORS.success }}
                    />
                  ) : (
                    <CrossIcon
                      className="h-4 w-4 shrink-0"
                      style={{ color: STATUS_COLORS.danger }}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-[#F4F4F5]">{entry.code}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6F6F7C]">{entry.message}</p>
                  </div>

                  <time className="shrink-0 text-xs tabular-nums text-[#6F6F7C]">
                    {timeFormatter.format(entry.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

import { getStatusMeta } from '../lib/status';
import { STATUS_COLORS } from '../lib/theme';
import { CheckIcon, ClockIcon, CrossIcon, MinusIcon } from './icons';

const ICONS = {
  success: CheckIcon,
  warning: ClockIcon,
  danger: CrossIcon,
  neutral: MinusIcon,
} as const;

export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = getStatusMeta(status);
  const Icon = ICONS[tone];

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#2B2B37] bg-[#17171F] py-1 pl-2 pr-3 text-xs font-medium text-[#D8D8E0]">
      <Icon className="h-3.5 w-3.5" style={{ color: STATUS_COLORS[tone] }} />
      {label}
    </span>
  );
}

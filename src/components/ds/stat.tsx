import { cn } from '@/lib/utils';
import type { Tone } from './status-badge';

const toneText: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-foreground',
  line: 'text-foreground',
};

/** A ledger row of figures: one bordered strip, divided into cells. */
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none',
        '[&>div]:border-b [&>div]:border-r lg:[&>div]:border-b-0 lg:[&>div:last-child]:border-r-0',
        className
      )}
    >
      {children}
    </dl>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('type-numeral mt-1.5 text-[1.75rem]', toneText[tone])}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

/** Thin proportion bar. Always pair with a text figure. */
export function Meter({ value, max = 100, tone = 'neutral', label }: { value: number; max?: number; tone?: Tone; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill: Record<Tone, string> = {
    success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info',
    neutral: 'bg-primary', line: 'bg-line',
  };
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-sm bg-muted"
    >
      <div className={cn('h-full rounded-sm', fill[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

import { Accessibility, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlateTag } from './plate-tag';

export interface BaySlot {
  slotCode: string;
  isOccupied: boolean;
  currentVehicle?: string | null;
  type?: string;
  assignedTo?: string;
}

/**
 * One parking bay, drawn the way it is painted on the deck: yellow lines on
 * three sides, the slot code stencilled at the open end.
 */
export function SlotBay({ slot, href }: { slot: BaySlot; href?: string }) {
  const state = slot.isOccupied ? `occupied by ${slot.currentVehicle ?? 'a vehicle'}` : 'free';
  const kind =
    slot.type === 'pwd' ? 'PWD bay' : slot.type === 'motorcycle' ? 'motorcycle bay' : slot.type === 'assigned' ? `reserved${slot.assignedTo ? ` for ${slot.assignedTo}` : ''}` : 'visitor bay';

  const inner = (
    <>
      <span className="flex min-h-9 flex-1 flex-col items-center justify-center gap-1 px-0.5">
        {slot.isOccupied ? (
          <PlateTag plate={slot.currentVehicle ?? '—'} size="sm" />
        ) : slot.type === 'pwd' ? (
          <Accessibility className="size-5 text-[#7fb2ec]" aria-hidden />
        ) : slot.type === 'motorcycle' ? (
          <Bike className="size-5 text-asphalt-foreground/50" aria-hidden />
        ) : null}
        {slot.type === 'assigned' && (
          <span className="max-w-full truncate text-[0.65rem] leading-none text-line">{slot.assignedTo ?? 'Reserved'}</span>
        )}
      </span>
      <span className={cn('type-stencil text-xs', slot.isOccupied ? 'text-asphalt-foreground/60' : 'text-asphalt-foreground')}>
        {slot.slotCode}
      </span>
    </>
  );

  const className = cn(
    'flex h-24 w-full flex-col items-center border-x-2 border-t-2 border-line/80 px-1 pb-1.5 pt-1.5 text-center',
    slot.isOccupied && 'bg-white/[0.06]',
    href && 'outline-none hover:bg-line/15 focus-visible:bg-line/25'
  );
  const title = `${slot.slotCode}: ${kind}, ${state}`;

  return href ? (
    <a href={href} className={className} aria-label={`${title}. Record an entry here.`} title={title}>
      {inner}
    </a>
  ) : (
    <div className={className} role="img" aria-label={title} title={title}>
      {inner}
    </div>
  );
}

/** The asphalt a row of bays sits on. */
export function Deck({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg bg-asphalt p-3 sm:p-4', className)}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-x-0 gap-y-4">{children}</div>
    </div>
  );
}

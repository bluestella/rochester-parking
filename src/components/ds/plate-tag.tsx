import { cn } from '@/lib/utils';

/** A licence plate. Stays light in dark mode, because plates do. */
export function PlateTag({ plate, size = 'md', className }: { plate: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      className={cn(
        'type-stencil inline-flex items-center whitespace-nowrap rounded-[3px] border-2 border-[#15201e] bg-[#f7f7f2] text-[#15201e]',
        size === 'sm' ? 'px-1 text-[0.7rem] leading-4' : 'px-1.5 text-sm leading-5',
        className
      )}
    >
      {plate}
    </span>
  );
}

import type { LucideIcon } from 'lucide-react';
import { Loader2, TriangleAlert } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 size-6 text-muted-foreground" aria-hidden />}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-[48ch] text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Loading and error states for anything fetched with `useApi`. */
export function DataState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  if (error) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger-subtle px-4 py-3 text-sm text-danger">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Could not load this.</p>
          <p>{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-1 font-semibold underline underline-offset-2">
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
  return null;
}

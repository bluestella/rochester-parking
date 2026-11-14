import { Pin } from 'lucide-react';
import { StatusBadge } from '@/components/ds';
import { formatDate } from '@/lib/format';

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  category: string;
  buildingName?: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt?: string;
}

export function AnnouncementCard({ announcement: a, actions, compact }: { announcement: Announcement; actions?: React.ReactNode; compact?: boolean }) {
  return (
    <article className={`rounded-lg border bg-card p-4 ${a.category === 'emergency' ? 'border-danger/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <StatusBadge status={a.category} />
            {a.pinned && (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Pin className="size-3" aria-hidden /> Pinned
              </span>
            )}
            <span>{formatDate(a.publishedAt)}</span>
            {a.buildingName && <span>{a.buildingName} only</span>}
          </div>
          <h3 className="font-semibold">{a.title}</h3>
        </div>
        {actions && <div className="flex shrink-0">{actions}</div>}
      </div>
      <p className={`mt-1.5 max-w-[70ch] whitespace-pre-wrap text-sm ${compact ? 'line-clamp-3' : ''}`}>{a.body}</p>
    </article>
  );
}

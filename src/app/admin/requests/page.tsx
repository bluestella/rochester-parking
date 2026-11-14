'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { DataState, EmptyState, Page, PageHeader } from '@/components/ds';
import { RequestDialog, RequestRow, type ServiceRequest } from '@/components/requests/RequestDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/lib/client';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminRequestsPage() {
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading, error, reload } = useApi<{ requests: ServiceRequest[]; counts: Record<string, number> }>(
    `/api/requests?limit=100&status=${status}${query ? `&search=${encodeURIComponent(query)}` : ''}`
  );
  const counts = data?.counts ?? {};
  const countFor = (value: string) =>
    value === 'active' ? (counts.open ?? 0) + (counts.in_progress ?? 0) + (counts.on_hold ?? 0) : counts[value] ?? 0;

  return (
    <Page>
      <PageHeader title="Service requests" description="Repairs and concerns reported by residents and staff. Open one to assign it, reply, or change its status." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium',
                status === f.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
              )}
            >
              {f.label} <span className="tabular-nums opacity-75">{countFor(f.value)}</span>
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }} className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, ticket or unit" aria-label="Search requests" className="lg:w-56" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data && data.requests.length === 0 && (
        <EmptyState icon={ClipboardList} title="No requests here">
          {status === 'active' ? 'Nothing is waiting on the office right now.' : 'No requests have this status.'}
        </EmptyState>
      )}
      {data && data.requests.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {data.requests.map((r) => <RequestRow key={r._id} request={r} showUnit onOpen={() => setOpenId(r._id)} />)}
        </ul>
      )}

      <RequestDialog requestId={openId} admin onClose={() => setOpenId(null)} onChanged={reload} />
    </Page>
  );
}

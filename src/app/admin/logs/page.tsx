'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { DataState, EmptyState, Page, PageHeader } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApi } from '@/lib/client';
import { label } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

interface Log {
  _id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: Record<string, unknown>;
  userId?: { name: string; role: string };
}

function summarise(details?: Record<string, unknown>) {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');
  const { data, loading, error, reload } = useApi<{ logs: Log[]; resources: string[]; pagination: { totalPages: number; total: number } }>(
    `/api/admin/logs?page=${page}${resource ? `&resource=${resource}` : ''}`
  );

  return (
    <Page>
      <PageHeader title="Activity log" description="A record of who changed what. Entries cannot be edited.">
        <NativeSelect value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }} aria-label="Filter by record type" className="w-48">
          <option value="">All record types</option>
          {data?.resources.map((r) => <option key={r} value={r}>{label(r)}</option>)}
        </NativeSelect>
      </PageHeader>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data?.logs.length === 0 && <EmptyState icon={ScrollText} title="No activity recorded yet" />}
      {data && data.logs.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>{log.userId?.name ?? 'Deleted user'}</TableCell>
                    <TableCell>{label(log.action)} {label(log.resource).toLowerCase()}</TableCell>
                    <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">{summarise(log.details)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {data.pagination.totalPages}, {data.pagination.total} entries</span>
            <span className="flex gap-2">
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden /></Button>
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}><ChevronRight aria-hidden /></Button>
            </span>
          </div>
        </>
      )}
    </Page>
  );
}

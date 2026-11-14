'use client';

import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataState, EmptyState, FormDialog, Page, PageHeader, type FieldDef } from '@/components/ds';
import { RequestDialog, RequestRow, type ServiceRequest } from '@/components/requests/RequestDialog';
import { Button } from '@/components/ui/button';
import { api, useApi } from '@/lib/client';
import { REQUEST_CATEGORIES, options } from '@/lib/constants';

const fields: FieldDef[] = [
  { name: 'title', label: 'What is the problem?', required: true, placeholder: 'Kitchen sink is leaking' },
  { name: 'category', label: 'Category', type: 'select', required: true, half: true, options: options(REQUEST_CATEGORIES) },
  { name: 'priority', label: 'How urgent?', type: 'select', required: true, half: true, options: [{ value: 'low', label: 'Can wait' }, { value: 'normal', label: 'This week' }, { value: 'high', label: 'As soon as possible' }] },
  { name: 'location', label: 'Where', placeholder: 'In my unit, or the lobby of Tower A' },
  { name: 'description', label: 'Details', type: 'textarea', required: true, hint: 'When it started, and the best time for staff to visit.' },
];

export default function ResidentRequestsPage() {
  const { data, loading, error, reload } = useApi<{ requests: ServiceRequest[] }>('/api/requests?limit=100');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Page>
      <PageHeader title="Requests" description="Report a repair or a concern, and follow what the admin office is doing about it.">
        <Button onClick={() => setCreating(true)}><Plus aria-hidden /> New request</Button>
      </PageHeader>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data?.requests.length === 0 && (
        <EmptyState icon={ClipboardList} title="No requests yet" action={<Button onClick={() => setCreating(true)}>New request</Button>}>
          Leaks, electrical faults, noise, anything in the common areas: tell the office here.
        </EmptyState>
      )}
      {data && data.requests.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {data.requests.map((r) => <RequestRow key={r._id} request={r} onOpen={() => setOpenId(r._id)} />)}
        </ul>
      )}

      <RequestDialog requestId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="New request"
        fields={fields}
        initial={{ category: 'plumbing', priority: 'normal' }}
        submitLabel="Send request"
        onSubmit={async (values) => {
          const r = await api<ServiceRequest>('/api/requests', { body: values });
          toast.success(`Request ${r.ticketNumber} sent`);
          reload();
        }}
      />
    </Page>
  );
}

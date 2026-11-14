'use client';

import { useState } from 'react';
import { DoorOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataState, EmptyState, FormDialog, Page, PageHeader, PlateTag, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { todayString, visitDate, type VisitorPass } from '@/components/visitors/types';
import { api, errorMessage, useApi } from '@/lib/client';

const fields: FieldDef[] = [
  { name: 'visitorName', label: 'Visitor name', required: true },
  { name: 'expectedDate', label: 'Date of visit', type: 'date', required: true, half: true, min: todayString() },
  { name: 'plateNumber', label: 'Plate number', half: true, hint: 'If they are driving.' },
  { name: 'purpose', label: 'Note for the guard', placeholder: 'Family, delivery, contractor' },
];

export default function ResidentVisitorsPage() {
  const { data, loading, error, reload } = useApi<VisitorPass[]>('/api/visitors');
  const [creating, setCreating] = useState(false);

  const cancel = async (pass: VisitorPass) => {
    if (!confirm(`Cancel the pass for ${pass.visitorName}?`)) return;
    try {
      await api(`/api/visitors/${pass._id}`, { method: 'PATCH', body: { action: 'cancel' } });
      toast.success('Pass cancelled');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Page>
      <PageHeader title="Visitors" description="Register guests ahead of time. Give them the pass code and the guard will let them straight in.">
        <Button onClick={() => setCreating(true)}><Plus aria-hidden /> Register visitor</Button>
      </PageHeader>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data?.length === 0 && (
        <EmptyState icon={DoorOpen} title="No visitors registered" action={<Button onClick={() => setCreating(true)}>Register visitor</Button>}>
          Expecting someone? Register them so they are not kept waiting at the gate.
        </EmptyState>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {data.map((v) => (
            <li key={v._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{v.visitorName}</span>
                  {v.plateNumber && <PlateTag plate={v.plateNumber} size="sm" />}
                </p>
                <p className="text-muted-foreground">{visitDate(v.expectedDate)}{v.purpose ? `. ${v.purpose}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                {v.status === 'expected' && (
                  <span className="text-sm">Pass code <span className="type-stencil rounded-sm bg-line px-1.5 py-0.5 text-base text-line-foreground">{v.code}</span></span>
                )}
                <StatusBadge status={v.status} />
                {v.status === 'expected' && <Button size="sm" variant="outline" onClick={() => cancel(v)}>Cancel pass</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Register visitor"
        fields={fields}
        initial={{ expectedDate: todayString() }}
        submitLabel="Create pass"
        onSubmit={async (values) => {
          const pass = await api<VisitorPass>('/api/visitors', { body: values });
          toast.success(`Pass created. Code ${pass.code}`);
          reload();
        }}
      />
    </Page>
  );
}

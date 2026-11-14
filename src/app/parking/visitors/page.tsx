'use client';

import { useState } from 'react';
import { DoorOpen, LogIn, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { DataState, EmptyState, FormDialog, Page, PageHeader, PlateTag, Stat, StatStrip, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayString, type VisitorPass } from '@/components/visitors/types';
import { useBuildings } from '@/hooks';
import { api, errorMessage, useApi } from '@/lib/client';
import { formatDateTime } from '@/lib/format';

export default function GateVisitorsPage() {
  const [date, setDate] = useState(todayString());
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useApi<VisitorPass[]>(
    `/api/visitors?date=${date}${query ? `&search=${encodeURIComponent(query)}` : ''}`
  );
  const { buildings } = useBuildings();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fields: FieldDef[] = [
    { name: 'visitorName', label: 'Visitor name', required: true },
    { name: 'buildingName', label: 'Building', type: 'select', required: true, half: true, options: buildings.map((b) => ({ value: b.name, label: b.name })) },
    { name: 'unitNumber', label: 'Unit visited', required: true, half: true, placeholder: '12A' },
    { name: 'plateNumber', label: 'Plate number', half: true, hint: 'Leave blank if on foot.' },
    { name: 'purpose', label: 'Purpose', half: true, placeholder: 'Delivery, guest, contractor' },
  ];

  const act = async (pass: VisitorPass, action: 'arrive' | 'depart' | 'deny') => {
    if (action === 'deny' && !confirm(`Turn away ${pass.visitorName}?`)) return;
    setBusy(pass._id);
    try {
      await api(`/api/visitors/${pass._id}`, { method: 'PATCH', body: { action } });
      toast.success(action === 'arrive' ? `${pass.visitorName} checked in` : action === 'depart' ? `${pass.visitorName} checked out` : 'Visitor turned away');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const list = data ?? [];
  const count = (status: string) => list.filter((v) => v.status === status).length;

  return (
    <Page>
      <PageHeader title="Visitors" description="Guests residents have pre-registered, and walk-ins you log at the gate.">
        <div>
          <Label htmlFor="visit-date" className="sr-only">Date</Label>
          <Input id="visit-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-40" />
        </div>
        <Button onClick={() => setOpen(true)}><UserPlus aria-hidden /> Log walk-in</Button>
      </PageHeader>

      {data && (
        <StatStrip className="mb-5">
          <Stat label="Expected" value={count('expected')} tone={count('expected') ? 'warning' : 'neutral'} />
          <Stat label="On the premises" value={count('arrived')} tone="success" />
          <Stat label="Left" value={count('departed')} />
        </StatStrip>
      )}

      <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }} className="mb-4 flex max-w-md gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, plate, unit or pass code" aria-label="Search visitors" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data && list.length === 0 && (
        <EmptyState icon={DoorOpen} title={query ? 'No visitor matches that search' : 'No visitors on this date'}>
          Ask for the pass code a resident shared, or log the visitor as a walk-in.
        </EmptyState>
      )}
      {list.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {list.map((v) => (
            <li key={v._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{v.visitorName}</span>
                  {v.plateNumber && <PlateTag plate={v.plateNumber} size="sm" />}
                  <StatusBadge status={v.status} />
                </p>
                <p className="text-muted-foreground">
                  Visiting {v.buildingName} {v.unitNumber}
                  {v.hostId ? ` (${v.hostId.name})` : ', walk-in'}
                  {v.purpose ? `. ${v.purpose}` : ''}. Pass <span className="type-stencil text-foreground">{v.code}</span>
                  {v.arrivedAt ? `. In ${formatDateTime(v.arrivedAt)}` : ''}
                  {v.departedAt ? `, out ${formatDateTime(v.departedAt)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {v.status === 'expected' && (
                  <>
                    <Button size="sm" disabled={busy === v._id} onClick={() => act(v, 'arrive')}><LogIn aria-hidden /> Check in</Button>
                    <Button size="sm" variant="outline" disabled={busy === v._id} onClick={() => act(v, 'deny')}>Turn away</Button>
                  </>
                )}
                {v.status === 'arrived' && (
                  <Button size="sm" variant="outline" disabled={busy === v._id} onClick={() => act(v, 'depart')}><LogOut aria-hidden /> Check out</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Log walk-in visitor"
        description="Confirm with the unit before letting the visitor in. They are checked in as soon as you save."
        fields={fields}
        submitLabel="Check in visitor"
        onSubmit={async (values) => {
          await api('/api/visitors', { body: { ...values, expectedDate: todayString(), walkIn: true } });
          toast.success('Visitor checked in');
          setDate(todayString());
          reload();
        }}
      />
    </Page>
  );
}

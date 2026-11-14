'use client';

import { useState } from 'react';
import { CalendarCheck, Check, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataState, EmptyState, FormDialog, Page, PageHeader, SectionTitle, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, errorMessage, useApi } from '@/lib/client';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { Amenity, Booking } from '@/components/amenities/types';


const fields: FieldDef[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'Function hall' },
  { name: 'location', label: 'Location', half: true, placeholder: 'Tower A, 5th floor' },
  { name: 'capacity', label: 'Capacity (people)', type: 'number', half: true },
  { name: 'openHour', label: 'Opens (hour, 0–23)', type: 'number', required: true, half: true, step: '1' },
  { name: 'closeHour', label: 'Closes (hour, 1–24)', type: 'number', required: true, half: true, step: '1' },
  { name: 'feePerHour', label: 'Fee per hour', type: 'number', required: true, half: true, hint: 'Use 0 if it is free.' },
  { name: 'description', label: 'Description and house rules', type: 'textarea' },
  { name: 'exclusive', label: 'One booking at a time', type: 'checkbox', hint: 'Turn off for shared spaces such as a gym or pool.' },
  { name: 'requiresApproval', label: 'Bookings need office approval', type: 'checkbox' },
  { name: 'isActive', label: 'Open for booking', type: 'checkbox' },
];

export default function AdminAmenitiesPage() {
  const amenities = useApi<Amenity[]>('/api/amenities');
  const bookings = useApi<Booking[]>('/api/bookings');
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (b: Booking, action: 'approve' | 'reject') => {
    const note = action === 'reject' ? prompt('Reason for declining (shown to the resident):') : undefined;
    if (action === 'reject' && note === null) return;
    setBusy(b._id);
    try {
      await api(`/api/bookings/${b._id}`, { method: 'PATCH', body: { action, note: note || undefined } });
      toast.success(
        action === 'approve'
          ? b.fee > 0 ? `Booking approved. ${formatMoney(b.fee)} was added to the unit’s account.` : 'Booking approved'
          : 'Booking declined'
      );
      bookings.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const all = bookings.data ?? [];
  const pending = all.filter((b) => b.status === 'pending');
  const upcoming = all.filter((b) => b.status === 'approved' && new Date(b.end) > new Date()).reverse();

  const row = (b: Booking, actions?: React.ReactNode) => (
    <li key={b._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <p className="font-semibold">{b.amenityId?.name}</p>
        <p>{formatDateTime(b.start)} to {new Date(b.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
        <p className="text-muted-foreground">
          {b.residentId?.name}{b.unitNumber ? `, ${b.buildingName ?? ''} ${b.unitNumber}` : ''}, {b.guests} guest{b.guests === 1 ? '' : 's'}
          {b.fee > 0 ? `, ${formatMoney(b.fee)}` : ''}{b.purpose ? `. ${b.purpose}` : ''}
        </p>
      </div>
      {actions ?? <StatusBadge status={b.status} />}
    </li>
  );

  return (
    <Page>
      <PageHeader title="Amenities" description="Shared spaces residents can book, and the requests waiting on you.">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus aria-hidden /> Add amenity</Button>
      </PageHeader>

      <Tabs defaultValue="bookings">
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">
            Bookings{pending.length > 0 && <span className="ml-1.5 rounded-sm bg-line px-1 text-xs font-semibold text-line-foreground">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="amenities">Spaces</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-8">
          <DataState loading={bookings.loading && !bookings.data} error={bookings.error} onRetry={bookings.reload} />
          {bookings.data && (
            <>
              <section>
                <SectionTitle>Waiting for approval</SectionTitle>
                {pending.length === 0 ? (
                  <EmptyState icon={CalendarCheck} title="No bookings to review" />
                ) : (
                  <ul className="divide-y rounded-lg border bg-card">
                    {pending.map((b) =>
                      row(b, (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy === b._id} onClick={() => decide(b, 'approve')}><Check aria-hidden /> Approve</Button>
                          <Button size="sm" variant="outline" disabled={busy === b._id} onClick={() => decide(b, 'reject')}><X aria-hidden /> Decline</Button>
                        </div>
                      ))
                    )}
                  </ul>
                )}
              </section>
              <section>
                <SectionTitle>Coming up</SectionTitle>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved bookings ahead.</p>
                ) : (
                  <ul className="divide-y rounded-lg border bg-card">{upcoming.map((b) => row(b))}</ul>
                )}
              </section>
            </>
          )}
        </TabsContent>

        <TabsContent value="amenities">
          <DataState loading={amenities.loading && !amenities.data} error={amenities.error} onRetry={amenities.reload} />
          {amenities.data?.length === 0 && <EmptyState title="No amenities yet">Add the function hall, pool, gym or courts so residents can book them.</EmptyState>}
          <ul className="grid gap-3 md:grid-cols-2">
            {amenities.data?.map((a) => (
              <li key={a._id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    <p className="text-sm text-muted-foreground">{a.location}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!a.isActive && <StatusBadge status="inactive">Closed</StatusBadge>}
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${a.name}`} onClick={() => { setEditing(a); setOpen(true); }}><Pencil aria-hidden /></Button>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  Open {a.openHour}:00 to {a.closeHour}:00. {a.feePerHour > 0 ? `${formatMoney(a.feePerHour)} per hour.` : 'Free to use.'}{' '}
                  {a.capacity ? `Up to ${a.capacity} people. ` : ''}{a.requiresApproval ? 'Needs approval.' : 'Confirmed instantly.'}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.name}` : 'Add amenity'}
        fields={fields}
        initial={editing ? { ...editing } : { openHour: 8, closeHour: 22, feePerHour: 0, exclusive: true, requiresApproval: true, isActive: true }}
        submitLabel={editing ? 'Save amenity' : 'Add amenity'}
        onSubmit={async (values) => {
          await api(editing ? `/api/amenities/${editing._id}` : '/api/amenities', { method: editing ? 'PUT' : 'POST', body: values });
          toast.success(editing ? 'Amenity saved' : 'Amenity added');
          amenities.reload();
        }}
      />
    </Page>
  );
}

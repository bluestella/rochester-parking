'use client';

import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Amenity, Booking } from '@/components/amenities/types';
import { DataState, EmptyState, FormDialog, Page, PageHeader, SectionTitle, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { api, errorMessage, useApi } from '@/lib/client';
import { formatDateTime, formatMoney } from '@/lib/format';

const fields = (a: Amenity | null): FieldDef[] => [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'from', label: 'From', type: 'select', required: true, half: true, options: hours(a?.openHour ?? 6, (a?.closeHour ?? 22) - 1) },
  { name: 'to', label: 'Until', type: 'select', required: true, half: true, options: hours((a?.openHour ?? 6) + 1, a?.closeHour ?? 22) },
  { name: 'guests', label: 'Number of people', type: 'number', required: true, half: true, min: '1', step: '1', hint: a?.capacity ? `Up to ${a.capacity}.` : undefined },
  { name: 'purpose', label: 'Occasion', half: true, placeholder: 'Birthday, meeting' },
];

function hours(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const h = from + i;
    const text = `${((h + 11) % 12) + 1}:00 ${h % 24 < 12 ? 'am' : 'pm'}`;
    return { value: String(h), label: h === 24 ? '12:00 midnight' : text };
  });
}

export default function ResidentBookingsPage() {
  const amenities = useApi<Amenity[]>('/api/amenities');
  const bookings = useApi<Booking[]>('/api/bookings');
  const [booking, setBooking] = useState<Amenity | null>(null);

  const cancel = async (b: Booking) => {
    if (!confirm(`Cancel your ${b.amenityId?.name} booking?`)) return;
    try {
      await api(`/api/bookings/${b._id}`, { method: 'PATCH', body: { action: 'cancel' } });
      toast.success('Booking cancelled');
      bookings.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Page>
      <PageHeader title="Amenities" description="Reserve a shared space. Paid bookings are added to your statement of account once approved." />

      <DataState loading={amenities.loading && !amenities.data} error={amenities.error} onRetry={amenities.reload} />
      {amenities.data?.length === 0 && <EmptyState icon={CalendarCheck} title="No amenities can be booked yet" />}
      <ul className="mb-10 grid gap-3 md:grid-cols-2">
        {amenities.data?.map((a) => (
          <li key={a._id} className="flex flex-col rounded-lg border bg-card p-4">
            <h2 className="type-title">{a.name}</h2>
            <p className="text-sm text-muted-foreground">{a.location}</p>
            {a.description && <p className="mt-2 text-sm">{a.description}</p>}
            <p className="mt-2 flex-1 text-sm">
              Open {a.openHour}:00 to {a.closeHour}:00. {a.feePerHour > 0 ? `${formatMoney(a.feePerHour)} per hour.` : 'Free for residents.'}{' '}
              {a.capacity ? `Up to ${a.capacity} people.` : ''}
            </p>
            <Button className="mt-4 self-start" onClick={() => setBooking(a)}>Book {a.name.toLowerCase()}</Button>
          </li>
        ))}
      </ul>

      <SectionTitle>My bookings</SectionTitle>
      {bookings.data?.length === 0 && <p className="text-sm text-muted-foreground">You have not booked anything yet.</p>}
      {bookings.data && bookings.data.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {bookings.data.map((b) => {
            const active = ['pending', 'approved'].includes(b.status) && new Date(b.start) > new Date();
            return (
              <li key={b._id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{b.amenityId?.name}</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(b.start)} to {new Date(b.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {b.fee > 0 ? `, ${formatMoney(b.fee)}` : ''}
                  </p>
                  {b.decisionNote && <p>Office note: {b.decisionNote}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {active && <Button size="sm" variant="outline" onClick={() => cancel(b)}>Cancel booking</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FormDialog
        open={Boolean(booking)}
        onOpenChange={(o) => !o && setBooking(null)}
        title={`Book ${booking?.name.toLowerCase() ?? ''}`}
        description={booking?.requiresApproval ? 'The admin office reviews each request, usually within a day.' : 'Your booking is confirmed as soon as you send it.'}
        fields={fields(booking)}
        initial={{ guests: 1, from: booking?.openHour, to: (booking?.openHour ?? 0) + 1 }}
        submitLabel={booking?.requiresApproval ? 'Request booking' : 'Book now'}
        onSubmit={async (v) => {
          const at = (hour: string | boolean) => {
            const d = new Date(`${v.date}T00:00:00`);
            d.setHours(Number(hour));
            return d.toISOString();
          };
          const created = await api<Booking>('/api/bookings', {
            body: { amenityId: booking!._id, start: at(v.from), end: at(v.to), guests: v.guests, purpose: v.purpose },
          });
          toast.success(created.status === 'approved' ? 'Booking confirmed' : 'Booking requested');
          bookings.reload();
        }}
      />
    </Page>
  );
}

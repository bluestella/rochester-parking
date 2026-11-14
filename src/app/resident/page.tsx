'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { CalendarCheck, ClipboardList, DoorOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AnnouncementCard, type Announcement } from '@/components/announcements/AnnouncementCard';
import { DataState, FormDialog, Page, PageHeader, PlateTag, SectionTitle, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { visitDate } from '@/components/visitors/types';
import { api, useApi } from '@/lib/client';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';

interface Overview {
  units: { _id: string; buildingName: string; unitNumber: string }[];
  balance: number;
  overdue: number;
  nextDue: { number: string; balance: number; dueDate: string; displayStatus: string } | null;
  bookings: { _id: string; start: string; status: string; amenityId?: { name: string } }[];
  requests: { _id: string; title: string; status: string; ticketNumber: string }[];
  visitors: { _id: string; visitorName: string; expectedDate: string; code: string }[];
  announcements: Announcement[];
  parked: { _id: string; plateNumber: string; parkingSlot: string; entryTimestamp: string }[];
}
interface Vehicle {
  _id: string;
  plateNumber: string;
  make?: string;
  vehicleModel?: string;
  color?: string;
}

const vehicleFields: FieldDef[] = [
  { name: 'plateNumber', label: 'Plate number', required: true, placeholder: 'ABC 1234' },
  { name: 'make', label: 'Make', half: true, placeholder: 'Toyota' },
  { name: 'vehicleModel', label: 'Model', half: true, placeholder: 'Vios' },
  { name: 'color', label: 'Colour', half: true },
];

const quickLinks = [
  { href: '/resident/bookings', label: 'Book an amenity', icon: CalendarCheck },
  { href: '/resident/requests', label: 'Report a problem', icon: ClipboardList },
  { href: '/resident/visitors', label: 'Register a visitor', icon: DoorOpen },
];

export default function ResidentHomePage() {
  const { data: session } = useSession();
  const { data, loading, error, reload } = useApi<Overview>('/api/overview');
  const vehicles = useApi<Vehicle[]>('/api/resident/vehicles');
  const [adding, setAdding] = useState(false);

  const unit = data?.units[0];
  const firstName = session?.user.name?.split(' ')[0] ?? '';

  return (
    <Page>
      <PageHeader
        title={`Hello, ${firstName}`}
        description={unit ? `${unit.buildingName}, unit ${unit.unitNumber}` : 'Your account is not linked to a unit yet. Ask the admin office to add it.'}
      />
      <DataState loading={loading && !data} error={error} onRetry={reload} />

      {data && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-8">
            {/* Balance: the one thing every resident opens the app for */}
            <section className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">Balance due</p>
              <p className={`type-numeral mt-1 text-5xl ${data.overdue ? 'text-danger' : ''}`}>{formatMoney(data.balance)}</p>
              <p className="mt-2 text-sm">
                {data.nextDue ? (
                  <>
                    Statement {data.nextDue.number} for {formatMoney(data.nextDue.balance)} is{' '}
                    {data.nextDue.displayStatus === 'overdue' ? <strong className="text-danger">overdue since {formatDate(data.nextDue.dueDate)}</strong> : <>due {formatDate(data.nextDue.dueDate)}</>}.
                  </>
                ) : (
                  'You are fully paid. Thank you.'
                )}
              </p>
              <Button asChild className="mt-4" variant={data.balance > 0 ? 'default' : 'outline'}>
                <Link href="/resident/dues">{data.balance > 0 ? 'View and pay dues' : 'View statements'}</Link>
              </Button>
            </section>

            <nav aria-label="Shortcuts" className="grid gap-2 sm:grid-cols-3">
              {quickLinks.map((q) => (
                <Link key={q.href} href={q.href} className="flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm font-semibold outline-none hover:bg-accent focus-visible:bg-accent">
                  <q.icon className="size-4 text-primary" aria-hidden /> {q.label}
                </Link>
              ))}
            </nav>

            <section>
              <SectionTitle action={<Link href="/resident/notices" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">All notices</Link>}>
                Notices
              </SectionTitle>
              {data.announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notices from the admin office right now.</p>
              ) : (
                <div className="space-y-3">{data.announcements.map((a) => <AnnouncementCard key={a._id} announcement={a} compact />)}</div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <SectionTitle action={<Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus aria-hidden /> Add vehicle</Button>}>
                My vehicles
              </SectionTitle>
              {(vehicles.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Register your vehicle so the guards can find you by plate number.</p>
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {vehicles.data!.map((v) => {
                    const parked = data.parked.find((p) => p.plateNumber === v.plateNumber);
                    return (
                      <li key={v._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="flex items-center gap-3">
                          <PlateTag plate={v.plateNumber} />
                          <span className="text-muted-foreground">{[v.color, v.make, v.vehicleModel].filter(Boolean).join(' ')}</span>
                        </span>
                        {parked ? <StatusBadge status="parked">In slot {parked.parkingSlot}</StatusBadge> : <span className="text-xs text-muted-foreground">Not on the deck</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <SectionTitle>Coming up</SectionTitle>
              {data.bookings.length + data.visitors.length + data.requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings, visitors or open requests.</p>
              ) : (
                <ul className="divide-y rounded-lg border bg-card text-sm">
                  {data.bookings.map((b) => (
                    <li key={b._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span><span className="font-medium">{b.amenityId?.name}</span><span className="block text-muted-foreground">{formatDateTime(b.start)}</span></span>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                  {data.visitors.map((v) => (
                    <li key={v._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span><span className="font-medium">{v.visitorName}</span><span className="block text-muted-foreground">Visiting {visitDate(v.expectedDate)}</span></span>
                      <span className="type-stencil">{v.code}</span>
                    </li>
                  ))}
                  {data.requests.map((r) => (
                    <li key={r._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0"><span className="block truncate font-medium">{r.title}</span><span className="text-muted-foreground">{r.ticketNumber}</span></span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <FormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add vehicle"
        fields={vehicleFields}
        submitLabel="Add vehicle"
        onSubmit={async (values) => {
          const body = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
          await api('/api/resident/vehicles', { body });
          toast.success('Vehicle added');
          vehicles.reload();
        }}
      />
    </Page>
  );
}

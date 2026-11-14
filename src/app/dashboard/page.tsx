'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ChevronRight, CircleCheck } from 'lucide-react';
import { DataState, Meter, Page, PageHeader, SectionTitle, Stat, StatStrip, StatusBadge } from '@/components/ds';
import { useApi } from '@/lib/client';
import { label } from '@/lib/constants';
import { formatDate, formatDateTime, formatMoney, formatPeriod } from '@/lib/format';

interface Overview {
  period: string;
  units: number;
  parking: { slots: number; occupied: number; free: number };
  billing: {
    billed: number;
    collected: number;
    collectionRate: number;
    outstanding: number;
    overdueCount: number;
    overdueAmount: number;
    pendingPayments: number;
  } | null;
  requests: {
    active: number;
    urgent: number;
    latest: { _id: string; ticketNumber: string; title: string; priority: string; status: string; unitNumber?: string }[];
  };
  pendingBookings: number;
  visitorsToday: number;
  equipmentDue: { _id: string; equipmentId: string; make: string; equipmentModel: string; preventativeMaintenanceSchedule: string }[];
  activity: { _id: string; action: string; resource: string; timestamp: string; userId?: { name: string } }[];
}

const PAST: Record<string, string> = {
  create: 'added a', update: 'updated a', delete: 'removed a', void: 'voided a', approve: 'approved a',
  reject: 'declined a', cancel: 'cancelled a', arrive: 'checked in a', depart: 'checked out a', deny: 'turned away a',
  exit: 'logged the exit of a', deactivate: 'closed a', add_charge: 'added a charge to a',
};
const PHRASES: Record<string, string> = {
  record_payment: 'recorded a payment', report_payment: 'reported a payment', confirm_payment: 'confirmed a payment',
  reject_payment: 'rejected a payment', billing_run: 'issued monthly statements', apply_penalties: 'added late charges',
};

function describe(action: string, resource: string) {
  if (PHRASES[action]) return PHRASES[action];
  const noun = label(resource).toLowerCase();
  return PAST[action] ? `${PAST[action]} ${noun}` : `${label(action).toLowerCase()} ${noun}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, loading, error, reload } = useApi<Overview>('/api/overview');

  // The work queue: only things that need a person, most pressing first.
  const queue = data
    ? [
        data.requests.urgent > 0 && { tone: 'urgent', text: `${data.requests.urgent} high-priority service request${data.requests.urgent === 1 ? '' : 's'} open`, href: '/admin/requests' },
        data.billing && data.billing.pendingPayments > 0 && { tone: 'pending', text: `${data.billing.pendingPayments} reported payment${data.billing.pendingPayments === 1 ? '' : 's'} to confirm`, href: '/admin/billing' },
        data.pendingBookings > 0 && { tone: 'pending', text: `${data.pendingBookings} amenity booking${data.pendingBookings === 1 ? '' : 's'} waiting for approval`, href: '/admin/amenities' },
        data.billing && data.billing.overdueCount > 0 && { tone: 'overdue', text: `${data.billing.overdueCount} statement${data.billing.overdueCount === 1 ? '' : 's'} overdue, ${formatMoney(data.billing.overdueAmount)} in total`, href: '/admin/billing' },
        data.equipmentDue.length > 0 && { tone: 'maintenance', text: `${data.equipmentDue.length} equipment item${data.equipmentDue.length === 1 ? '' : 's'} due for maintenance within two weeks`, href: '/admin/equipments' },
        data.visitorsToday > 0 && { tone: 'expected', text: `${data.visitorsToday} visitor${data.visitorsToday === 1 ? '' : 's'} expected today`, href: '/parking/visitors' },
      ].filter(Boolean) as { tone: string; text: string; href: string }[]
    : [];

  return (
    <Page>
      <PageHeader
        title="Overview"
        description={`${new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}. Signed in as ${session?.user.name ?? ''}.`}
      />
      <DataState loading={loading && !data} error={error} onRetry={reload} />

      {data && (
        <div className="space-y-8">
          <StatStrip>
            <Stat
              label="Parking bays free"
              value={<>{data.parking.free}<span className="text-base text-muted-foreground"> / {data.parking.slots}</span></>}
              hint={<span className="mt-1.5 block"><Meter value={data.parking.occupied} max={data.parking.slots || 1} tone="line" label="Parking occupancy" /><span className="mt-1 block">{data.parking.occupied} occupied</span></span>}
            />
            {data.billing && (
              <>
                <Stat
                  label={`Collected, ${formatPeriod(data.period)}`}
                  value={formatMoney(data.billing.collected)}
                  hint={<span className="mt-1.5 block"><Meter value={data.billing.collectionRate} tone="success" label="Collection rate" /><span className="mt-1 block">{data.billing.collectionRate}% of {formatMoney(data.billing.billed)} billed</span></span>}
                />
                <Stat label="Outstanding dues" value={formatMoney(data.billing.outstanding)} tone={data.billing.overdueCount ? 'danger' : 'neutral'} hint={`${data.billing.overdueCount} overdue`} />
              </>
            )}
            <Stat label="Open service requests" value={data.requests.active} hint={`Across ${data.units} units`} />
          </StatStrip>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section>
              <SectionTitle>Needs attention</SectionTitle>
              {queue.length === 0 ? (
                <p className="flex items-center gap-2 rounded-lg border bg-card px-4 py-4 text-sm">
                  <CircleCheck className="size-4 text-success" aria-hidden /> Nothing is waiting on the office.
                </p>
              ) : (
                <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                  {queue.map((item) => (
                    <li key={item.text}>
                      <Link href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm outline-none hover:bg-accent/50 focus-visible:bg-accent/50">
                        <span className="flex items-center gap-3">
                          <StatusBadge status={item.tone} />
                          <span className="font-medium">{item.text}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8">
                <SectionTitle action={<Link href="/admin/requests" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">All requests</Link>}>
                  Latest service requests
                </SectionTitle>
                {data.requests.latest.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open requests.</p>
                ) : (
                  <ul className="divide-y rounded-lg border bg-card">
                    {data.requests.latest.map((r) => (
                      <li key={r._id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{r.title}</span>
                          <span className="text-muted-foreground">{r.ticketNumber}{r.unitNumber ? `, unit ${r.unitNumber}` : ''}</span>
                        </span>
                        <StatusBadge status={['urgent', 'high'].includes(r.priority) ? r.priority : r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <div className="space-y-8">
              {data.equipmentDue.length > 0 && (
                <section>
                  <SectionTitle>Maintenance due</SectionTitle>
                  <ul className="divide-y rounded-lg border bg-card text-sm">
                    {data.equipmentDue.map((e) => (
                      <li key={e._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span>
                          <span className="font-medium">{e.equipmentId}</span>
                          <span className="block text-muted-foreground">{e.make} {e.equipmentModel}</span>
                        </span>
                        <span className={new Date(e.preventativeMaintenanceSchedule) < new Date() ? 'font-semibold text-danger' : ''}>
                          {formatDate(e.preventativeMaintenanceSchedule)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <SectionTitle action={<Link href="/admin/logs" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">Full log</Link>}>
                  Recent activity
                </SectionTitle>
                {data.activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
                ) : (
                  <ol className="space-y-2.5 border-l-2 pl-4 text-sm">
                    {data.activity.map((a) => (
                      <li key={a._id}>
                        <span className="font-medium">{a.userId?.name ?? 'Someone'}</span>{' '}
                        {describe(a.action, a.resource)}
                        <span className="block text-xs text-muted-foreground">{formatDateTime(a.timestamp)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

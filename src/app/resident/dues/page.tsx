'use client';

import { useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDetail } from '@/components/billing/InvoiceDetail';
import type { BillingSettings, Invoice, Payment } from '@/components/billing/types';
import { DataState, EmptyState, FormDialog, Page, PageHeader, SectionTitle, Stat, StatStrip, StatusBadge, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { api, useApi } from '@/lib/client';
import { PAYMENT_METHODS, options } from '@/lib/constants';
import { formatDate, formatMoney, formatPeriod, toLocalInput } from '@/lib/format';

export default function ResidentDuesPage() {
  const invoices = useApi<{ invoices: Invoice[] }>('/api/billing/invoices?limit=60');
  const payments = useApi<{ payments: Payment[] }>('/api/billing/payments?status=pending');
  const settings = useApi<BillingSettings>('/api/billing/settings');
  const [viewing, setViewing] = useState<string | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);

  const list = invoices.data?.invoices ?? [];
  const open = list.filter((i) => i.status === 'open');
  const balance = open.reduce((sum, i) => sum + i.balance, 0);
  const overdue = open.filter((i) => i.displayStatus === 'overdue');
  const pendingFor = (id: string) => (payments.data?.payments ?? []).find((p) => p.invoiceId?._id === id);

  const fields: FieldDef[] = [
    { name: 'amount', label: 'Amount you paid', type: 'number', required: true, half: true },
    { name: 'method', label: 'How you paid', type: 'select', required: true, half: true, options: options(PAYMENT_METHODS.filter((m) => m !== 'cash')) },
    { name: 'paidAt', label: 'When', type: 'datetime-local', required: true, half: true },
    { name: 'reference', label: 'Reference number', required: true, half: true, hint: 'From your bank or e-wallet receipt.' },
  ];

  return (
    <Page>
      <PageHeader title="Dues" description="Your statements of account and how to settle them." />
      <DataState loading={invoices.loading && !invoices.data} error={invoices.error} onRetry={invoices.reload} />

      {invoices.data && (
        <div className="space-y-8">
          <StatStrip>
            <Stat label="Balance due" value={formatMoney(balance)} tone={overdue.length ? 'danger' : 'neutral'} />
            <Stat label="Unpaid statements" value={open.length} hint={overdue.length ? `${overdue.length} overdue` : 'None overdue'} />
            {settings.data && <Stat label="Dues rate" value={formatMoney(settings.data.duesRatePerSqm)} hint="per sqm, per month" />}
          </StatStrip>

          {settings.data?.paymentInstructions && balance > 0 && (
            <section className="rounded-lg border bg-card p-4">
              <h2 className="mb-1 font-semibold">How to pay</h2>
              <p className="max-w-[70ch] whitespace-pre-wrap text-sm">{settings.data.paymentInstructions}</p>
              <p className="mt-2 text-sm text-muted-foreground">After paying, choose “I have paid” on the statement so the office can confirm it.</p>
            </section>
          )}

          <section>
            <SectionTitle>Statements</SectionTitle>
            {list.length === 0 ? (
              <EmptyState icon={ReceiptText} title="No statements yet">Your first statement appears here when the admin office issues the month’s billing.</EmptyState>
            ) : (
              <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                {list.map((inv) => {
                  const pending = pendingFor(inv._id);
                  return (
                    <li key={inv._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={() => setViewing(inv._id)} className="text-left outline-none focus-visible:underline">
                        <span className="font-semibold underline-offset-2 hover:underline">{formatPeriod(inv.period)}</span>
                        <span className="block text-sm text-muted-foreground">
                          {inv.number}, {inv.buildingName} {inv.unitNumber}, due {formatDate(inv.dueDate)}
                        </span>
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="type-numeral text-xl">{formatMoney(inv.status === 'paid' ? inv.total : inv.balance)}</span>
                        {pending ? <StatusBadge status="pending">Payment being confirmed</StatusBadge> : <StatusBadge status={inv.displayStatus} />}
                        {inv.status === 'open' && !pending && <Button size="sm" onClick={() => setPaying(inv)}>I have paid</Button>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      <InvoiceDetail invoiceId={viewing} onClose={() => setViewing(null)} />

      <FormDialog
        open={Boolean(paying)}
        onOpenChange={(o) => !o && setPaying(null)}
        title="Report a payment"
        description={paying ? `Statement ${paying.number}. The office checks it against their records, then marks the statement paid.` : undefined}
        fields={fields}
        initial={{ amount: paying?.balance, method: 'bank_transfer', paidAt: toLocalInput(new Date()) }}
        submitLabel="Report payment"
        onSubmit={async (v) => {
          await api('/api/billing/payments', { body: { ...v, invoiceId: paying!._id, paidAt: new Date(String(v.paidAt)).toISOString() } });
          toast.success('Payment reported. You will see it confirmed here.');
          payments.reload();
        }}
      />
    </Page>
  );
}

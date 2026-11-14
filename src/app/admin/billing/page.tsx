'use client';

import { useState } from 'react';
import { Check, Download, FilePlus2, Percent, ReceiptText, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDetail } from '@/components/billing/InvoiceDetail';
import type { BillingSettings, Invoice, Payment } from '@/components/billing/types';
import { DataState, EmptyState, FormDialog, Meter, Page, PageHeader, SectionTitle, Stat, StatStrip, StatusBadge, type FieldDef, type FormValues } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage, useApi } from '@/lib/client';
import { CHARGE_KINDS, PAYMENT_METHODS, label, options } from '@/lib/constants';
import { currentPeriod, formatDate, formatMoney, formatPeriod, toLocalInput } from '@/lib/format';

interface Summary {
  billed: number;
  collected: number;
  collectionRate: number;
  statements: number;
  paidStatements: number;
  outstanding: number;
  overdue: number;
  pendingPayments: number;
  aging: { label: string; amount: number; count: number }[];
  delinquent: { unit: string; balance: number; statements: number }[];
}

const paymentFields = (balance: number): FieldDef[] => [
  { name: 'amount', label: 'Amount received', type: 'number', required: true, half: true, hint: `Balance is ${formatMoney(balance)}.` },
  { name: 'method', label: 'Method', type: 'select', required: true, half: true, options: options(PAYMENT_METHODS) },
  { name: 'paidAt', label: 'Received on', type: 'datetime-local', required: true, half: true },
  { name: 'reference', label: 'Reference number', half: true, placeholder: 'Check or transfer ref' },
];

const chargeFields: FieldDef[] = [
  { name: 'kind', label: 'Charge type', type: 'select', required: true, half: true, options: options(CHARGE_KINDS) },
  { name: 'amount', label: 'Amount', type: 'number', required: true, half: true },
  { name: 'description', label: 'Description', required: true, placeholder: 'Water, October reading' },
];

export default function BillingPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { can } = useCan();
  const manage = can('billing:manage');

  const summary = useApi<Summary>(`/api/billing/summary?period=${period}`);
  const invoices = useApi<{ invoices: Invoice[] }>(
    `/api/billing/invoices?limit=200&period=${period}${status ? `&status=${status}` : ''}${query ? `&search=${encodeURIComponent(query)}` : ''}`
  );
  const pending = useApi<{ payments: Payment[] }>('/api/billing/payments?status=pending&limit=50');
  const recent = useApi<{ payments: Payment[] }>('/api/billing/payments?status=confirmed&limit=15');
  const units = useApi<{ units: { _id: string; buildingName: string; unitNumber: string }[] }>('/api/units?limit=200');

  const [viewing, setViewing] = useState<string | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [charging, setCharging] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    summary.reload();
    invoices.reload();
    pending.reload();
    recent.reload();
  };

  const act = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    try {
      toast.success(await fn());
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const issue = () =>
    act('run', async () => {
      const r = await api<{ created: number; skipped: number; billed: number }>('/api/billing/run', { body: { period } });
      return r.created
        ? `Issued ${r.created} statement${r.created === 1 ? '' : 's'} totalling ${formatMoney(r.billed)}${r.skipped ? `. ${r.skipped} already billed.` : ''}`
        : `Every unit already has a statement for ${formatPeriod(period)}`;
    });

  const penalties = () => {
    if (!confirm('Add this month’s late charge to every overdue statement? Statements already charged this month are skipped.')) return;
    act('penalties', async () => {
      const r = await api<{ charged: number; amount: number }>('/api/billing/penalties', { method: 'POST' });
      return r.charged ? `Added late charges to ${r.charged} statement${r.charged === 1 ? '' : 's'} (${formatMoney(r.amount)})` : 'No overdue statements need a late charge';
    });
  };

  const review = (payment: Payment, action: 'confirm' | 'reject') =>
    act(payment._id, async () => {
      await api(`/api/billing/payments/${payment._id}`, { method: 'PATCH', body: { action } });
      return action === 'confirm' ? 'Payment confirmed' : 'Payment rejected';
    });

  const voidInvoice = (inv: Invoice) => {
    if (!confirm(`Void statement ${inv.number}? This cannot be undone.`)) return;
    act(inv._id, async () => {
      await api(`/api/billing/invoices/${inv._id}`, { method: 'PATCH', body: { action: 'void' } });
      setViewing(null);
      return 'Statement voided';
    });
  };

  const s = summary.data;
  const list = invoices.data?.invoices ?? [];
  const waiting = pending.data?.payments ?? [];

  return (
    <Page>
      <PageHeader
        title="Dues and billing"
        description={manage ? 'Issue monthly statements, record payments, and follow up on what is overdue.' : 'Statements, payments and receivables. View only: the accounting team issues statements and records payments.'}
      >
        <div>
          <Label htmlFor="period" className="sr-only">Billing month</Label>
          <Input id="period" type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className="w-40" />
        </div>
        {manage && (
          <Button onClick={issue} disabled={busy === 'run'}>
            <Send aria-hidden /> Issue statements
          </Button>
        )}
      </PageHeader>

      {s && (
        <StatStrip className="mb-6">
          <Stat label={`Billed, ${formatPeriod(period)}`} value={formatMoney(s.billed)} hint={`${s.statements} statement${s.statements === 1 ? '' : 's'}`} />
          <Stat
            label="Collected"
            value={formatMoney(s.collected)}
            hint={
              <span className="mt-1.5 block">
                <Meter value={s.collectionRate} tone="success" label="Collection rate" />
                <span className="mt-1 block">{s.collectionRate}% of billed, {s.paidStatements} paid in full</span>
              </span>
            }
          />
          <Stat label="Outstanding, all months" value={formatMoney(s.outstanding)} />
          <Stat label="Overdue" value={formatMoney(s.overdue)} tone={s.overdue > 0 ? 'danger' : 'neutral'} />
        </StatStrip>
      )}

      <Tabs defaultValue="statements">
        <TabsList className="mb-4">
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="payments">
            Payments{waiting.length > 0 && <span className="ml-1.5 rounded-sm bg-line px-1 text-xs font-semibold text-line-foreground">{waiting.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="statements">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }} className="flex flex-1 gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Unit or statement number" aria-label="Search statements" className="max-w-xs" />
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="sm:w-40">
              <option value="">All statuses</option>
              <option value="open">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </NativeSelect>
            {manage && <Button variant="outline" onClick={() => setCreating(true)}><FilePlus2 aria-hidden /> One-off statement</Button>}
            {can('billing:export') && (
              <Button variant="outline" asChild>
                <a href={`/api/billing/export?period=${period}`}><Download aria-hidden /> Export CSV</a>
              </Button>
            )}
          </div>

          <DataState loading={invoices.loading && !invoices.data} error={invoices.error} onRetry={invoices.reload} />
          {invoices.data && list.length === 0 && (
            <EmptyState icon={ReceiptText} title={`No statements for ${formatPeriod(period)}`} action={manage && !status && !query ? <Button onClick={issue}>Issue statements</Button> : undefined}>
              {status || query ? 'Nothing matches the current filter.' : 'Issue statements to bill every active unit its dues and parking fees for the month.'}
            </EmptyState>
          )}
          {list.length > 0 && (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead className="hidden md:table-cell">Statement</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell>
                        <button type="button" onClick={() => setViewing(inv._id)} className="text-left font-semibold underline-offset-2 hover:underline">
                          {inv.unitNumber}
                        </button>
                        <span className="block text-xs text-muted-foreground">{inv.buildingName}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{inv.number}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(inv.total)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(inv.balance)}</TableCell>
                      <TableCell><StatusBadge status={inv.displayStatus} /></TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        {manage && inv.status === 'open' && (
                          <Button size="sm" variant="outline" onClick={() => setPaying(inv)}>Record payment</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-8">
          <section>
            <SectionTitle>Waiting for confirmation</SectionTitle>
            {waiting.length === 0 ? (
              <EmptyState title="Nothing to confirm">Payments that residents report online appear here for you to check against the bank or cash record.</EmptyState>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {waiting.map((p) => (
                  <li key={p._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      <p>
                        <span className="type-numeral text-lg">{formatMoney(p.amount)}</span> by {label(p.method).toLowerCase()}
                        {p.reference && <>, ref <span className="font-medium">{p.reference}</span></>}
                      </p>
                      <p className="text-muted-foreground">
                        {p.invoiceId?.buildingName} {p.invoiceId?.unitNumber}, statement {p.invoiceId?.number}. Reported by {p.submittedBy?.name} on {formatDate(p.paidAt)}.
                      </p>
                    </div>
                    {manage && <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(p, 'confirm')} disabled={busy === p._id}><Check aria-hidden /> Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => review(p, 'reject')} disabled={busy === p._id}><X aria-hidden /> Reject</Button>
                    </div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <SectionTitle>Recently received</SectionTitle>
            {(recent.data?.payments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="hidden sm:table-cell">Method</TableHead>
                      <TableHead className="hidden sm:table-cell">Received</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.data!.payments.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">{p.receiptNumber}</TableCell>
                        <TableCell>{p.invoiceId?.buildingName} {p.invoiceId?.unitNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell">{label(p.method)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatDate(p.paidAt)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="receivables">
          {s && (
            <div className="grid gap-8 lg:grid-cols-2">
              <section>
                <SectionTitle action={manage && <Button size="sm" variant="outline" onClick={penalties} disabled={busy === 'penalties'}><Percent aria-hidden /> Add late charges</Button>}>
                  Unpaid by age
                </SectionTitle>
                <ul className="space-y-3 rounded-lg border bg-card p-4">
                  {s.aging.map((bucket, i) => (
                    <li key={bucket.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{bucket.label} <span className="text-muted-foreground">({bucket.count})</span></span>
                        <span className="font-semibold tabular-nums">{formatMoney(bucket.amount)}</span>
                      </div>
                      <Meter value={bucket.amount} max={s.outstanding || 1} tone={i === 0 ? 'neutral' : i < 3 ? 'warning' : 'danger'} label={bucket.label} />
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <SectionTitle>Largest overdue balances</SectionTitle>
                {s.delinquent.length === 0 ? (
                  <EmptyState title="No overdue balances">Every open statement is still within its due date.</EmptyState>
                ) : (
                  <ol className="divide-y rounded-lg border bg-card">
                    {s.delinquent.map((d) => (
                      <li key={d.unit} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span>
                          <span className="font-semibold">{d.unit}</span>
                          <span className="block text-muted-foreground">{d.statements} overdue statement{d.statements === 1 ? '' : 's'}</span>
                        </span>
                        <span className="type-numeral text-lg text-danger">{formatMoney(d.balance)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rates">
          <RatesForm editable={can('billing:settings')} />
        </TabsContent>
      </Tabs>

      <InvoiceDetail
        invoiceId={viewing}
        onClose={() => setViewing(null)}
        footer={(inv) =>
          manage && inv.status === 'open' && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" onClick={() => { setViewing(null); setPaying(inv); }}>Record payment</Button>
              <Button size="sm" variant="outline" onClick={() => { setViewing(null); setCharging(inv); }}>Add charge</Button>
              {inv.amountPaid === 0 && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => voidInvoice(inv)}>Void statement</Button>}
            </div>
          )
        }
      />

      <FormDialog
        open={Boolean(paying)}
        onOpenChange={(o) => !o && setPaying(null)}
        title="Record payment"
        description={paying ? `${paying.buildingName} ${paying.unitNumber}, statement ${paying.number}` : undefined}
        fields={paymentFields(paying?.balance ?? 0)}
        initial={{ amount: paying?.balance, method: 'cash', paidAt: toLocalInput(new Date()) }}
        submitLabel="Record payment"
        onSubmit={async (v: FormValues) => {
          const p = await api<{ receiptNumber: string }>('/api/billing/payments', {
            body: { ...v, invoiceId: paying!._id, paidAt: new Date(String(v.paidAt)).toISOString() },
          });
          toast.success(`Payment recorded, receipt ${p.receiptNumber}`);
          refresh();
        }}
      />

      <FormDialog
        open={Boolean(charging)}
        onOpenChange={(o) => !o && setCharging(null)}
        title="Add charge"
        description={charging ? `Adds a line to statement ${charging.number}.` : undefined}
        fields={chargeFields}
        initial={{ kind: 'utility' }}
        submitLabel="Add charge"
        onSubmit={async (v) => {
          await api(`/api/billing/invoices/${charging!._id}`, { method: 'PATCH', body: { action: 'add_charge', item: v } });
          toast.success('Charge added');
          refresh();
        }}
      />

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="One-off statement"
        description="For charges outside the monthly run, such as repairs or move-in fees."
        fields={[
          { name: 'unitId', label: 'Unit', type: 'select', required: true, options: (units.data?.units ?? []).map((u) => ({ value: u._id, label: `${u.buildingName} ${u.unitNumber}` })) },
          ...chargeFields,
          { name: 'dueDate', label: 'Due date', type: 'date', required: true, half: true },
        ]}
        initial={{ kind: 'other' }}
        submitLabel="Issue statement"
        onSubmit={async (v) => {
          await api('/api/billing/invoices', {
            body: { unitId: v.unitId, period, dueDate: v.dueDate, items: [{ kind: v.kind, description: v.description, amount: v.amount }] },
          });
          toast.success('Statement issued');
          refresh();
        }}
      />
    </Page>
  );
}

function RatesForm({ editable }: { editable: boolean }) {
  const { data, loading, error, reload } = useApi<BillingSettings>('/api/billing/settings');
  const [saving, setSaving] = useState(false);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/billing/settings', { method: 'PUT', body: Object.fromEntries(new FormData(e.currentTarget)) });
      toast.success('Rates saved. They apply to statements issued from now on.');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof BillingSettings, text: string, hint: string, props: React.ComponentProps<'input'> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{text}</Label>
      <Input id={name} name={name} type="number" step="any" min="0" required defaultValue={data[name]} aria-describedby={`${name}-hint`} {...props} />
      <p id={`${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="max-w-2xl rounded-lg border bg-card p-5">
      <fieldset disabled={!editable} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field('duesRatePerSqm', 'Association dues per sqm', 'Charged monthly on each unit’s floor area.')}
        {field('parkingFee', 'Parking fee per assigned slot', 'A slot can override this with its own fee.')}
        {field('dueDay', 'Due day of the month', 'Between 1 and 28.', { min: 1, max: 28, step: 1 })}
        {field('penaltyRatePercent', 'Late charge (%)', 'Applied to the unpaid balance, once per month, when you add late charges.', { max: 100 })}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="paymentInstructions">How to pay</Label>
        <Textarea id="paymentInstructions" name="paymentInstructions" rows={4} defaultValue={data.paymentInstructions} placeholder="Bank account, e-wallet number, cashier hours" />
        <p className="text-xs text-muted-foreground">Residents see this next to their balance.</p>
      </div>
      {editable ? (
        <Button type="submit" disabled={saving}>Save rates</Button>
      ) : (
        <p className="text-sm text-muted-foreground">Rates are set by the accounting team.</p>
      )}
      </fieldset>
    </form>
  );
}

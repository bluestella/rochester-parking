'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataState, StatusBadge } from '@/components/ds';
import { useApi } from '@/lib/client';
import { label } from '@/lib/constants';
import { formatDate, formatMoney, formatPeriod } from '@/lib/format';
import type { Invoice, Payment } from './types';

/** A statement of account: charges, payments received, and what is still owed. */
export function InvoiceDetail({ invoiceId, onClose, footer }: { invoiceId: string | null; onClose: () => void; footer?: (invoice: Invoice) => React.ReactNode }) {
  const { data, loading, error } = useApi<Invoice & { payments: Payment[] }>(
    invoiceId ? `/api/billing/invoices/${invoiceId}` : null
  );
  const invoice = invoiceId && data?._id === invoiceId ? data : null;

  return (
    <Dialog open={Boolean(invoiceId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? `Statement ${invoice.number}` : 'Statement'}</DialogTitle>
          <DialogDescription>
            {invoice ? `${invoice.buildingName} ${invoice.unitNumber}, ${formatPeriod(invoice.period)}` : 'Loading statement'}
          </DialogDescription>
        </DialogHeader>
        {!invoice && <DataState loading={loading} error={error} />}
        {invoice && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <StatusBadge status={invoice.displayStatus} />
              <span className="text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
            </div>

            <table className="w-full text-sm">
              <caption className="sr-only">Charges</caption>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="py-2 pr-3">
                      {item.description}
                      <span className="block text-xs text-muted-foreground">{label(item.kind)}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatMoney(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="pt-2 text-left font-medium">Total</th>
                  <td className="pt-2 text-right tabular-nums">{formatMoney(invoice.total)}</td>
                </tr>
                <tr>
                  <th scope="row" className="text-left font-medium">Paid</th>
                  <td className="text-right tabular-nums">{formatMoney(invoice.amountPaid)}</td>
                </tr>
                <tr className="text-base">
                  <th scope="row" className="pt-1 text-left font-semibold">Balance</th>
                  <td className="type-numeral pt-1 text-right text-xl">{formatMoney(invoice.balance)}</td>
                </tr>
              </tfoot>
            </table>

            {invoice.payments.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Payments</h3>
                <ul className="divide-y rounded-md border text-sm">
                  {invoice.payments.map((p) => (
                    <li key={p._id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span>
                        {formatMoney(p.amount)} by {label(p.method).toLowerCase()}
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(p.paidAt)}
                          {p.receiptNumber ? `, receipt ${p.receiptNumber}` : p.reference ? `, ref ${p.reference}` : ''}
                        </span>
                      </span>
                      <StatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {footer?.(invoice)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

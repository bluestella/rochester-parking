'use client';

import { ROLE_LABELS, isRole } from '@/lib/permissions';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataState, StatusBadge } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage, useApi } from '@/lib/client';
import { REQUEST_PRIORITIES, REQUEST_STATUSES, label } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

export interface ServiceRequest {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location?: string;
  buildingName?: string;
  unitNumber?: string;
  assignee?: string;
  requesterId?: { name: string };
  createdAt: string;
  updates: { at: string; byName: string; byRole: string; note?: string; status?: string }[];
}

/** Ticket detail with its history. Admins triage here; the requester can reply or close. */
export function RequestDialog({ requestId, admin, onClose, onChanged }: { requestId: string | null; admin?: boolean; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error, reload } = useApi<ServiceRequest>(requestId ? `/api/requests/${requestId}` : null);
  const [saving, setSaving] = useState(false);
  const request = requestId && data?._id === requestId ? data : null;
  const finished = request && ['resolved', 'closed'].includes(request.status);

  const send = async (body: Record<string, unknown>, done: string) => {
    setSaving(true);
    try {
      await api(`/api/requests/${requestId}`, { method: 'PATCH', body });
      toast.success(done);
      reload();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const body: Record<string, unknown> = {};
    if (values.note?.trim()) body.note = values.note.trim();
    if (admin && request) {
      if (values.status !== request.status) body.status = values.status;
      if (values.priority !== request.priority) body.priority = values.priority;
      if ((values.assignee ?? '') !== (request.assignee ?? '')) body.assignee = values.assignee;
    }
    if (Object.keys(body).length === 0) return toast.info('Nothing changed');
    send(body, 'Request updated').then(() => form.reset());
  };

  return (
    <Dialog open={Boolean(requestId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{request?.title ?? 'Service request'}</DialogTitle>
          <DialogDescription>
            {request
              ? `${request.ticketNumber}, ${label(request.category).toLowerCase()}${request.unitNumber ? `, ${request.buildingName ?? ''} ${request.unitNumber}` : ''}`
              : 'Loading request'}
          </DialogDescription>
        </DialogHeader>
        {!request && <DataState loading={loading} error={error} />}
        {request && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge status={request.status} />
              <StatusBadge status={request.priority}>{label(request.priority)} priority</StatusBadge>
              {request.assignee && <span className="text-muted-foreground">Assigned to {request.assignee}</span>}
            </div>
            <p className="whitespace-pre-wrap text-sm">{request.description}</p>
            {request.location && <p className="text-sm text-muted-foreground">Location: {request.location}</p>}

            <div>
              <h3 className="mb-2 text-sm font-semibold">History</h3>
              <ol className="space-y-3 border-l-2 pl-4 text-sm">
                {request.updates.map((u, i) => (
                  <li key={i}>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(u.at)}, {u.byName} ({isRole(u.byRole) ? ROLE_LABELS[u.byRole].toLowerCase() : u.byRole})
                    </p>
                    {u.status && <p className="font-medium">Marked {label(u.status).toLowerCase()}</p>}
                    {u.note && <p className="whitespace-pre-wrap">{u.note}</p>}
                  </li>
                ))}
              </ol>
            </div>

            <form onSubmit={submit} className="space-y-4 border-t pt-4">
              {admin && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rq-status">Status</Label>
                    <NativeSelect id="rq-status" name="status" defaultValue={request.status} key={request.status}>
                      {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rq-priority">Priority</Label>
                    <NativeSelect id="rq-priority" name="priority" defaultValue={request.priority} key={request.priority}>
                      {REQUEST_PRIORITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rq-assignee">Assigned to</Label>
                    <Input id="rq-assignee" name="assignee" defaultValue={request.assignee ?? ''} placeholder="Staff or contractor" />
                  </div>
                </div>
              )}
              {(admin || !finished) && (
                <div className="space-y-1.5">
                  <Label htmlFor="rq-note">{admin ? 'Note to the resident' : 'Add a reply'}</Label>
                  <Textarea id="rq-note" name="note" rows={3} placeholder={admin ? 'What was done, or what happens next' : 'More detail, or a time that works for a visit'} />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(admin || !finished) && <Button type="submit" disabled={saving}>{admin ? 'Save update' : 'Send reply'}</Button>}
                {!admin && !finished && (
                  <Button type="button" variant="outline" disabled={saving} onClick={() => send({ status: 'closed' }, 'Request closed')}>
                    Close request
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RequestRow({ request, onOpen, showUnit }: { request: ServiceRequest; onOpen: () => void; showUnit?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full flex-col gap-1.5 px-4 py-3 text-left outline-none hover:bg-accent/50 focus-visible:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block truncate font-semibold">{request.title}</span>
          <span className="block text-sm text-muted-foreground">
            {request.ticketNumber}, {label(request.category).toLowerCase()}
            {showUnit && request.unitNumber ? `, ${request.buildingName ?? ''} ${request.unitNumber}` : ''}
            {showUnit && request.requesterId ? `, ${request.requesterId.name}` : ''}, filed {formatDateTime(request.createdAt)}
          </span>
        </span>
        <span className="flex shrink-0 gap-1.5">
          {['high', 'urgent'].includes(request.priority) && <StatusBadge status={request.priority} />}
          <StatusBadge status={request.status} />
        </span>
      </button>
    </li>
  );
}

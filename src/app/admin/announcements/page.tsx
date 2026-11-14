'use client';

import { useState } from 'react';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnnouncementCard, type Announcement } from '@/components/announcements/AnnouncementCard';
import { DataState, EmptyState, FormDialog, Page, PageHeader, type FieldDef } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { useBuildings } from '@/hooks';
import { api, errorMessage, useApi } from '@/lib/client';
import { ANNOUNCEMENT_CATEGORIES, options } from '@/lib/constants';

export default function AnnouncementsPage() {
  const { data, loading, error, reload } = useApi<Announcement[]>('/api/announcements?all=1');
  const { buildings } = useBuildings();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const fields: FieldDef[] = [
    { name: 'title', label: 'Title', required: true, placeholder: 'Water interruption on Saturday' },
    { name: 'body', label: 'Message', type: 'textarea', required: true },
    { name: 'category', label: 'Type', type: 'select', required: true, half: true, options: options(ANNOUNCEMENT_CATEGORIES) },
    { name: 'buildingName', label: 'Only for building', type: 'select', half: true, options: buildings.map((b) => ({ value: b.name, label: b.name })), hint: 'Leave as None to reach everyone.' },
    { name: 'expiresAt', label: 'Take down on', type: 'date', half: true },
    { name: 'pinned', label: 'Pin to the top', type: 'checkbox', hint: 'Pinned notices stay above newer ones.' },
  ];

  const remove = async (a: Announcement) => {
    if (!confirm(`Delete “${a.title}”? Residents will no longer see it.`)) return;
    try {
      await api(`/api/announcements/${a._id}`, { method: 'DELETE' });
      toast.success('Announcement deleted');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Page>
      <PageHeader title="Announcements" description="Notices shown on every resident’s home page.">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus aria-hidden /> New announcement</Button>
      </PageHeader>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data?.length === 0 && (
        <EmptyState icon={Megaphone} title="No announcements yet">Post a notice about maintenance work, events, or building rules.</EmptyState>
      )}
      <div className="space-y-3">
        {data?.map((a) => (
          <AnnouncementCard
            key={a._id}
            announcement={a}
            actions={
              <>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${a.title}`} onClick={() => { setEditing(a); setOpen(true); }}><Pencil aria-hidden /></Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${a.title}`} onClick={() => remove(a)}><Trash2 aria-hidden /></Button>
              </>
            }
          />
        ))}
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit announcement' : 'New announcement'}
        fields={fields}
        initial={editing ? { ...editing, expiresAt: editing.expiresAt?.slice(0, 10) } : { category: 'notice' }}
        submitLabel={editing ? 'Save announcement' : 'Post announcement'}
        onSubmit={async (values) => {
          await api(editing ? `/api/announcements/${editing._id}` : '/api/announcements', { method: editing ? 'PUT' : 'POST', body: values });
          toast.success(editing ? 'Announcement saved' : 'Announcement posted');
          reload();
        }}
      />
    </Page>
  );
}

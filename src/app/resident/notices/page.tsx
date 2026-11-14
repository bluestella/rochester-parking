'use client';

import { Bell } from 'lucide-react';
import { AnnouncementCard, type Announcement } from '@/components/announcements/AnnouncementCard';
import { DataState, EmptyState, Page, PageHeader } from '@/components/ds';
import { useApi } from '@/lib/client';

export default function NoticesPage() {
  const { data, loading, error, reload } = useApi<Announcement[]>('/api/announcements');
  return (
    <Page narrow>
      <PageHeader title="Notices" description="Announcements from the admin office." />
      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data?.length === 0 && <EmptyState icon={Bell} title="No notices right now" />}
      <div className="space-y-3">{data?.map((a) => <AnnouncementCard key={a._id} announcement={a} />)}</div>
    </Page>
  );
}

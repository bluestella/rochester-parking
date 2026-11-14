'use client';

import { useMemo, useState } from 'react';
import { Home, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataState, EmptyState, FormDialog, Page, PageHeader, StatusBadge, type FieldDef, type FormValues } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBuildings } from '@/hooks';
import { api, errorMessage, useApi } from '@/lib/client';
import { OCCUPANCY, UNIT_TYPES, label, options } from '@/lib/constants';
import { formatMoney } from '@/lib/format';

interface Unit {
  _id: string;
  buildingName: string;
  unitNumber: string;
  floor?: string;
  type: string;
  areaSqm: number;
  occupancy: string;
  ownerId?: { _id: string; name: string };
  tenantName?: string;
  slots: { slotCode: string; monthlyFee?: number }[];
}
interface Settings {
  duesRatePerSqm: number;
  parkingFee: number;
}

export default function UnitsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useApi<{ units: Unit[] }>(
    `/api/units?limit=200${query ? `&search=${encodeURIComponent(query)}` : ''}`
  );
  const { data: settings } = useApi<Settings>('/api/billing/settings');
  const { data: people } = useApi<{ users: { _id: string; name: string; unitNumber?: string }[] }>(
    '/api/admin/users?role=resident&limit=100'
  );
  const { buildings } = useBuildings();
  const [editing, setEditing] = useState<Unit | null>(null);
  const [open, setOpen] = useState(false);

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'buildingName', label: 'Building', type: 'select', required: true, half: true, options: buildings.map((b) => ({ value: b.name, label: b.name })) },
      { name: 'unitNumber', label: 'Unit number', required: true, half: true, placeholder: '12A' },
      { name: 'type', label: 'Type', type: 'select', required: true, half: true, options: options(UNIT_TYPES) },
      { name: 'areaSqm', label: 'Floor area (sqm)', type: 'number', required: true, half: true, hint: 'Monthly dues are floor area × the rate per sqm.' },
      { name: 'ownerId', label: 'Owner', type: 'select', options: (people?.users ?? []).map((u) => ({ value: u._id, label: u.name })) },
      { name: 'occupancy', label: 'Occupancy', type: 'select', required: true, half: true, options: options(OCCUPANCY) },
      { name: 'tenantName', label: 'Tenant name', half: true, showIf: (v) => v.occupancy === 'tenanted' },
      { name: 'floor', label: 'Floor', half: true },
    ],
    [buildings, people]
  );

  const monthly = (unit: Unit) =>
    settings
      ? unit.areaSqm * settings.duesRatePerSqm +
        unit.slots.reduce((sum, s) => sum + (s.monthlyFee ?? settings.parkingFee), 0)
      : 0;

  const save = async (values: FormValues) => {
    await api(editing ? `/api/units/${editing._id}` : '/api/units', {
      method: editing ? 'PUT' : 'POST',
      body: values,
    });
    toast.success(editing ? 'Unit saved' : 'Unit added');
    reload();
  };

  const remove = async (unit: Unit) => {
    if (!confirm(`Retire ${unit.buildingName} ${unit.unitNumber}? Its billing history is kept.`)) return;
    try {
      await api(`/api/units/${unit._id}`, { method: 'DELETE' });
      toast.success('Unit retired');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const units = data?.units ?? [];

  return (
    <Page>
      <PageHeader title="Units" description="Every unit, who owns it, and what it is billed each month.">
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus aria-hidden /> Add unit
        </Button>
      </PageHeader>

      <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }} className="mb-4 flex max-w-md gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Unit number, owner or tenant" aria-label="Search units" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data && units.length === 0 && (
        <EmptyState icon={Home} title={query ? 'No units match that search' : 'No units yet'}>
          {query ? 'Try a unit number or a name.' : 'Add units so dues can be billed and residents can be linked to them.'}
        </EmptyState>
      )}
      {units.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden md:table-cell">Occupancy</TableHead>
                <TableHead className="hidden lg:table-cell">Parking</TableHead>
                <TableHead className="text-right">Monthly bill</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <span className="font-semibold">{unit.unitNumber}</span>
                    <span className="block text-xs text-muted-foreground">{unit.buildingName}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{label(unit.type)}</TableCell>
                  <TableCell className="text-right tabular-nums">{unit.areaSqm} sqm</TableCell>
                  <TableCell>
                    {unit.ownerId?.name ?? <span className="text-muted-foreground">Not set</span>}
                    {unit.tenantName && <span className="block text-xs text-muted-foreground">Tenant: {unit.tenantName}</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={unit.occupancy === 'vacant' ? 'inactive' : 'active'}>{label(unit.occupancy)}</StatusBadge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {unit.slots.length ? unit.slots.map((s) => s.slotCode).join(', ') : <span className="text-muted-foreground">None</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(monthly(unit))}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${unit.unitNumber}`} onClick={() => { setEditing(unit); setOpen(true); }}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Retire ${unit.unitNumber}`} onClick={() => remove(unit)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.buildingName} ${editing.unitNumber}` : 'Add unit'}
        fields={fields}
        initial={editing ? { ...editing, ownerId: editing.ownerId?._id } : { type: '1br', occupancy: 'owner_occupied' }}
        submitLabel={editing ? 'Save unit' : 'Add unit'}
        onSubmit={save}
      />
    </Page>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { ParkingCircle, RefreshCw } from 'lucide-react';
import { DataState, Deck, EmptyState, Page, PageHeader, SlotBay, Stat, StatStrip } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/client';
import { cn } from '@/lib/utils';

interface Slot {
  _id: string;
  slotCode: string;
  buildingName?: string;
  floor: string;
  isOccupied: boolean;
  currentVehicle?: string | null;
  type?: string;
  assignedUnitId?: { buildingName: string; unitNumber: string } | null;
}

export default function DeckMapPage() {
  const { data, loading, error, reload } = useApi<{ slots: Slot[]; totalSlots: number; availableSlots: number; occupiedSlots: number }>('/api/parking-slots');
  const [building, setBuilding] = useState<string | null>(null);

  const buildings = useMemo(
    () => [...new Set((data?.slots ?? []).map((s) => s.buildingName || 'Unassigned'))].sort(),
    [data]
  );
  const active = building ?? buildings[0] ?? null;

  const floors = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of data?.slots ?? []) {
      if ((slot.buildingName || 'Unassigned') !== active) continue;
      map.set(slot.floor, [...(map.get(slot.floor) ?? []), slot]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data, active]);

  const visitorFree = (data?.slots ?? []).filter((s) => !s.isOccupied && (s.type ?? 'visitor') === 'visitor').length;

  return (
    <Page>
      <PageHeader title="Deck map" description="Every bay as it stands right now. Select a free bay to record a vehicle entering it.">
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} aria-hidden /> Refresh
        </Button>
      </PageHeader>

      <DataState loading={loading && !data} error={error} onRetry={reload} />
      {data && data.totalSlots === 0 && (
        <EmptyState icon={ParkingCircle} title="No parking slots set up">An admin can add slots under Parking, Slots.</EmptyState>
      )}

      {data && data.totalSlots > 0 && (
        <>
          <StatStrip className="mb-6">
            <Stat label="Free bays" value={data.availableSlots} tone="success" hint={`of ${data.totalSlots}`} />
            <Stat label="Occupied" value={data.occupiedSlots} />
            <Stat label="Free visitor bays" value={visitorFree} hint="Not reserved for a unit" />
          </StatStrip>

          {buildings.length > 1 && (
            <div role="group" aria-label="Building" className="mb-5 flex flex-wrap gap-1.5">
              {buildings.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={b === active}
                  onClick={() => setBuilding(b)}
                  className={cn('rounded-md border px-3 py-1.5 text-sm font-medium', b === active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {floors.map(([floor, slots]) => {
              const free = slots.filter((s) => !s.isOccupied).length;
              return (
                <section key={floor} aria-label={`${active}, ${floor}`}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="type-title">{floor}</h2>
                    <p className="text-sm text-muted-foreground">{free} of {slots.length} free</p>
                  </div>
                  <Deck>
                    {slots.map((slot) => (
                      <SlotBay
                        key={slot._id}
                        slot={{ ...slot, assignedTo: slot.assignedUnitId ? slot.assignedUnitId.unitNumber : undefined }}
                        href={slot.isOccupied ? undefined : `/parking/new?slot=${encodeURIComponent(slot.slotCode)}&building=${encodeURIComponent(slot.buildingName ?? '')}`}
                      />
                    ))}
                  </Deck>
                </section>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            A plate marks an occupied bay. A unit number in yellow marks a bay reserved for that unit.
          </p>
        </>
      )}
    </Page>
  );
}

'use client';

import { toast } from 'sonner';
import { FormDialog, type FieldDef } from '@/components/ds';
import { useBuildings } from '@/hooks';
import { api, useApi } from '@/lib/client';
import { SLOT_TYPES, options } from '@/lib/constants';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName?: string;
  floor: string;
  isOccupied: boolean;
  type?: string;
  assignedUnitId?: string | { _id: string } | null;
  monthlyFee?: number | null;
}

interface ParkingSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: ParkingSlot | null;
  onSuccess: () => void;
}

export function ParkingSlotModal({ open, onOpenChange, slot, onSuccess }: ParkingSlotModalProps) {
  const { buildings } = useBuildings();
  const { data } = useApi<{ units: { _id: string; buildingName: string; unitNumber: string }[] }>(
    open ? '/api/units?limit=200' : null
  );

  const fields: FieldDef[] = [
    { name: 'slotCode', label: 'Slot code', required: true, half: true, placeholder: 'P1-A01', hint: 'As painted on the bay.' },
    { name: 'floor', label: 'Floor', required: true, half: true, placeholder: 'P1, B1, Ground' },
    { name: 'buildingName', label: 'Building', type: 'select', required: true, half: true, options: buildings.map((b) => ({ value: b.name, label: b.name })) },
    { name: 'type', label: 'Use', type: 'select', required: true, half: true, options: options(SLOT_TYPES) },
    {
      name: 'assignedUnitId',
      label: 'Reserved for unit',
      type: 'select',
      showIf: (v) => v.type === 'assigned',
      options: (data?.units ?? []).map((u) => ({ value: u._id, label: `${u.buildingName} ${u.unitNumber}` })),
      hint: 'The unit is billed for this slot every month.',
    },
    {
      name: 'monthlyFee',
      label: 'Monthly fee for this slot',
      type: 'number',
      showIf: (v) => v.type === 'assigned',
      hint: 'Leave blank to use the standard parking fee.',
    },
  ];

  const assigned = slot?.assignedUnitId;
  const initial = slot
    ? { ...slot, type: slot.type ?? 'visitor', assignedUnitId: typeof assigned === 'object' ? assigned?._id : assigned }
    : { type: 'visitor' };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={slot ? `Edit slot ${slot.slotCode}` : 'Add parking slot'}
      fields={fields}
      initial={initial}
      submitLabel={slot ? 'Save slot' : 'Add slot'}
      onSubmit={async (values) => {
        const body: Record<string, unknown> = { ...values, slotCode: String(values.slotCode).toUpperCase() };
        if (values.type === 'assigned' && !('monthlyFee' in values)) body.monthlyFee = '';
        await api(slot ? `/api/admin/parking-slots/${slot._id}` : '/api/admin/parking-slots', {
          method: slot ? 'PUT' : 'POST',
          body,
        });
        toast.success(slot ? 'Slot saved' : 'Slot added');
        onSuccess();
      }}
    />
  );
}

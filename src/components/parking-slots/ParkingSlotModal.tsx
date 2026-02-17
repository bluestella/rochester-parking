'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
}

interface ParkingSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: ParkingSlot | null;
  onSuccess: () => void;
}

export function ParkingSlotModal({
  open,
  onOpenChange,
  slot,
  onSuccess,
}: ParkingSlotModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slotCode: '',
    floor: '',
  });

  useEffect(() => {
    if (slot) {
      setFormData({
        slotCode: slot.slotCode,
        floor: slot.floor,
      });
    } else {
      setFormData({
        slotCode: '',
        floor: '',
      });
    }
  }, [slot, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = slot
        ? `/api/admin/parking-slots/${slot._id}`
        : '/api/admin/parking-slots';
      const method = slot ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.error)
            ? data.error[0]?.message
            : data.error || 'Failed to save parking slot'
        );
      }

      toast.success(slot ? 'Parking slot updated successfully' : 'Parking slot created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{slot ? 'Edit Parking Slot' : 'Add New Parking Slot'}</DialogTitle>
            <DialogDescription>
              {slot
                ? 'Update parking slot information.'
                : 'Create a new parking slot.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slotCode">Slot Code *</Label>
              <Input
                id="slotCode"
                value={formData.slotCode}
                onChange={(e) =>
                  setFormData({ ...formData, slotCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g., P1-A01"
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique code for this parking slot
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor *</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({ ...formData, floor: e.target.value })
                }
                placeholder="e.g., P1, B1, Ground"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {slot ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

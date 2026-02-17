'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Clock, Car } from 'lucide-react';

interface ParkingRecord {
  _id: string;
  plateNumber: string;
  buildingName: string;
  unitNumber: string;
  parkingSlot: string;
  entryTimestamp: string;
}

interface ExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: ParkingRecord | null;
  onSuccess: () => void;
}

export function ExitModal({
  open,
  onOpenChange,
  record,
  onSuccess,
}: ExitModalProps) {
  const [loading, setLoading] = useState(false);

  if (!record) return null;

  const entryTime = new Date(record.entryTimestamp);
  const now = new Date();
  const durationMs = now.getTime() - entryTime.getTime();
  const durationMins = Math.round(durationMs / (1000 * 60));

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const handleExit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parking/${record._id}/exit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process exit');
      }

      toast.success(
        `Vehicle ${record.plateNumber} has exited. Duration: ${data.data.formattedDuration}`
      );
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Confirm Vehicle Exit
          </DialogTitle>
          <DialogDescription>
            Mark this vehicle as exited from the parking area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Plate Number</p>
              <p className="font-medium text-lg">{record.plateNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parking Slot</p>
              <p className="font-medium">{record.parkingSlot}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Building</p>
              <p className="font-medium">{record.buildingName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unit</p>
              <p className="font-medium">{record.unitNumber}</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration of Stay</span>
            </div>
            <p className="text-2xl font-semibold">{formatDuration(durationMins)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Entry: {entryTime.toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleExit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

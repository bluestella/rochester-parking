'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Car } from 'lucide-react';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
}

const BUILDINGS = ['Tower A', 'Tower B', 'Tower C'];

export function ParkingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [formData, setFormData] = useState({
    plateNumber: '',
    buildingName: '',
    unitNumber: '',
    parkingSlot: '',
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/parking-slots?available=true');
      const data = await res.json();
      if (data.success) {
        setSlots(data.data.slots);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create parking record');
      }

      toast.success('Parking record created successfully');
      router.push('/parking');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = slots.filter(
    (slot) => !formData.buildingName || slot.buildingName === formData.buildingName
  );

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          New Parking Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number *</Label>
            <Input
              id="plateNumber"
              placeholder="ABC 1234"
              value={formData.plateNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  plateNumber: e.target.value.toUpperCase(),
                })
              }
              required
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buildingName">Building *</Label>
            <Select
              value={formData.buildingName}
              onValueChange={(value) =>
                setFormData({ ...formData, buildingName: value, parkingSlot: '' })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {BUILDINGS.map((building) => (
                  <SelectItem key={building} value={building}>
                    {building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit Number *</Label>
            <Input
              id="unitNumber"
              placeholder="e.g., 12A, 305"
              value={formData.unitNumber}
              onChange={(e) =>
                setFormData({ ...formData, unitNumber: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parkingSlot">Parking Slot *</Label>
            <Select
              value={formData.parkingSlot}
              onValueChange={(value) =>
                setFormData({ ...formData, parkingSlot: value })
              }
              required
              disabled={loadingSlots}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingSlots ? 'Loading slots...' : 'Select parking slot'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No available slots
                  </SelectItem>
                ) : (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot._id} value={slot.slotCode}>
                      {slot.slotCode} ({slot.floor})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

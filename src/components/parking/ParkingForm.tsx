'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBuildings } from '@/hooks';
import { ResidentSearch } from './ResidentSearch';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Car, User, Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
}

type EntryMode = 'resident' | 'manual';

export function ParkingForm() {
  const router = useRouter();
  const { buildings, loading: loadingBuildings } = useBuildings();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [entryMode, setEntryMode] = useState<EntryMode>('resident');
  const [selectedResident, setSelectedResident] = useState<{
    vehicleId?: string;
    residentId?: string;
  } | null>(null);
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
      const res = await fetch('/api/parking-slots?available=true', {
        credentials: 'include',
      });
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

  const handleResidentSelect = (data: {
    plateNumber: string;
    buildingName: string;
    unitNumber: string;
    vehicleId?: string;
    residentId?: string;
  }) => {
    setFormData({
      ...formData,
      plateNumber: data.plateNumber,
      buildingName: data.buildingName,
      unitNumber: data.unitNumber,
      parkingSlot: '',
    });
    setSelectedResident({
      vehicleId: data.vehicleId,
      residentId: data.residentId,
    });
  };

  const handleClearResident = () => {
    setFormData({
      plateNumber: '',
      buildingName: '',
      unitNumber: '',
      parkingSlot: '',
    });
    setSelectedResident(null);
  };

  const handleModeChange = (mode: string) => {
    setEntryMode(mode as EntryMode);
    handleClearResident();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        vehicleId: selectedResident?.vehicleId,
        residentId: selectedResident?.residentId,
      };

      const res = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  const availableSlots = slots;

  const isResidentMode = entryMode === 'resident';
  const hasSelectedVehicle = isResidentMode && selectedResident !== null;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          New Parking Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Entry Mode Toggle */}
        <Tabs value={entryMode} onValueChange={handleModeChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resident" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Resident
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resident Search (only in resident mode) */}
          {isResidentMode && !hasSelectedVehicle && (
            <ResidentSearch onSelect={handleResidentSelect} />
          )}

          {/* Selected Vehicle Info (in resident mode after selection) */}
          {hasSelectedVehicle && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Selected Vehicle</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearResident}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Plate:</span>
                  <p className="font-medium">{formData.plateNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Building:</span>
                  <p className="font-medium">{formData.buildingName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit:</span>
                  <p className="font-medium">{formData.unitNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Fields (in manual mode OR before selection in resident mode) */}
          {!isResidentMode && (
            <>
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
                  disabled={loadingBuildings}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBuildings ? 'Loading...' : 'Select building'} />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building._id} value={building.name}>
                        {building.name}
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
            </>
          )}

          {/* Parking Slot (always shown when vehicle info is available) */}
          {(hasSelectedVehicle || !isResidentMode) && (
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
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (isResidentMode && !hasSelectedVehicle)}
              className={cn('flex-1', isResidentMode && !hasSelectedVehicle && 'opacity-50')}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

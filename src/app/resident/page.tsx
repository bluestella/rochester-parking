'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Car,
  Clock,
  ParkingCircle,
  History,
  Plus,
  Loader2,
} from 'lucide-react';

interface Stats {
  totalVisitsThisMonth: number;
  averageDurationFormatted: string;
  mostUsedSlot: string | null;
  currentlyParked: number;
  activeRecords: Array<{
    _id: string;
    plateNumber: string;
    parkingSlot: string;
    entryTimestamp: string;
  }>;
}

interface Vehicle {
  _id: string;
  plateNumber: string;
  buildingName: string;
  unitNumber: string;
  make?: string;
  model?: string;
  color?: string;
}

const BUILDINGS = ['Tower A', 'Tower B', 'Tower C'];

export default function ResidentPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    buildingName: '',
    unitNumber: '',
    make: '',
    model: '',
    color: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, vehiclesRes] = await Promise.all([
        fetch('/api/resident/history?limit=1'),
        fetch('/api/resident/vehicles'),
      ]);

      const historyData = await historyRes.json();
      const vehiclesData = await vehiclesRes.json();

      if (historyData.success) {
        setStats(historyData.data.stats);
      }
      if (vehiclesData.success) {
        setVehicles(vehiclesData.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVehicle(true);

    try {
      const res = await fetch('/api/resident/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.error)
            ? data.error[0]?.message
            : data.error || 'Failed to add vehicle'
        );
      }

      toast.success('Vehicle registered successfully');
      setVehicleForm({
        plateNumber: '',
        buildingName: '',
        unitNumber: '',
        make: '',
        model: '',
        color: '',
      });
      setShowVehicleForm(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAddingVehicle(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Parking Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {session?.user.name}. View your parking activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Currently Parked</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.currentlyParked || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              vehicles in parking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visits This Month</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalVisitsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              parking entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageDurationFormatted || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              per visit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorite Slot</CardTitle>
            <ParkingCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.mostUsedSlot || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              most used
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Currently Parked */}
        <Card>
          <CardHeader>
            <CardTitle>Currently Parked Vehicles</CardTitle>
            <CardDescription>
              Vehicles registered to your unit that are currently parked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.activeRecords && stats.activeRecords.length > 0 ? (
              <div className="space-y-3">
                {stats.activeRecords.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{record.plateNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Slot: {record.parkingSlot}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Parked</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Since {formatDate(record.entryTimestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No vehicles currently parked
              </p>
            )}
          </CardContent>
        </Card>

        {/* Registered Vehicles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>
                Vehicles registered to your account
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVehicleForm(!showVehicleForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {showVehicleForm && (
              <form onSubmit={handleAddVehicle} className="space-y-4 mb-6 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">Plate Number *</Label>
                    <Input
                      id="plateNumber"
                      value={vehicleForm.plateNumber}
                      onChange={(e) =>
                        setVehicleForm({
                          ...vehicleForm,
                          plateNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="ABC 1234"
                      required
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building">Building *</Label>
                    <Select
                      value={vehicleForm.buildingName}
                      onValueChange={(value) =>
                        setVehicleForm({ ...vehicleForm, buildingName: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUILDINGS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit Number *</Label>
                    <Input
                      id="unit"
                      value={vehicleForm.unitNumber}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, unitNumber: e.target.value })
                      }
                      placeholder="12A"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={vehicleForm.color}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, color: e.target.value })
                      }
                      placeholder="Black"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVehicleForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingVehicle}>
                    {addingVehicle && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Register Vehicle
                  </Button>
                </div>
              </form>
            )}

            {vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{vehicle.plateNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.buildingName} - {vehicle.unitNumber}
                      </p>
                    </div>
                    {vehicle.color && (
                      <Badge variant="outline">{vehicle.color}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No vehicles registered yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View History Link */}
      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/resident/history">
            <History className="h-4 w-4 mr-2" />
            View Full Parking History
          </Link>
        </Button>
      </div>
    </div>
  );
}

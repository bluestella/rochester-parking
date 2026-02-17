'use client';

import { useState, useEffect, useCallback } from 'react';
import { ParkingSlotTable } from '@/components/parking-slots/ParkingSlotTable';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
  currentVehicle?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminParkingSlotsPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    buildingName: '',
    isOccupied: '',
    page: 1,
  });

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '10');
      if (filters.search) params.set('search', filters.search);
      if (filters.buildingName && filters.buildingName !== 'all') {
        params.set('buildingName', filters.buildingName);
      }
      if (filters.isOccupied && filters.isOccupied !== 'all') {
        params.set('isOccupied', filters.isOccupied === 'occupied' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/parking-slots?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setSlots(data.data.slots);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch parking slots:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, isOccupied: status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Parking Slot Management</h1>
          <p className="text-muted-foreground">
            Manage parking slots across all buildings
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchSlots}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ParkingSlotTable
        slots={slots}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onRefresh={fetchSlots}
      />
    </div>
  );
}

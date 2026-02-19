'use client';

import { useState, useEffect, useCallback } from 'react';
import { EquipmentTable } from '@/components/admin/EquipmentTable';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Equipment {
  _id: string;
  equipmentId: string;
  make: string;
  equipmentModel: string;
  preventativeMaintenanceSchedule?: string;
  partsInventory?: string;
  operatorDetails?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminEquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
  });

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '10');
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/admin/equipments?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setEquipments(data.data.equipments);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch equipments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">
            Manage condominium equipment, maintenance, and inventory
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchEquipments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <EquipmentTable
        equipments={equipments}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRefresh={fetchEquipments}
      />
    </div>
  );
}

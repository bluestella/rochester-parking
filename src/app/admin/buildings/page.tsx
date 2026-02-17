'use client';

import { useState, useEffect, useCallback } from 'react';
import { BuildingTable } from '@/components/buildings/BuildingTable';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Building {
  _id: string;
  name: string;
  code: string;
  address?: string;
  floors: number;
  isActive: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
  });

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '10');
      if (filters.search) params.set('search', filters.search);
      if (filters.isActive && filters.isActive !== 'all') {
        params.set('isActive', filters.isActive === 'active' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/buildings?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setBuildings(data.data.buildings);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, isActive: status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Building Management</h1>
          <p className="text-muted-foreground">
            Manage buildings in the condominium complex
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchBuildings}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <BuildingTable
        buildings={buildings}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onRefresh={fetchBuildings}
      />
    </div>
  );
}

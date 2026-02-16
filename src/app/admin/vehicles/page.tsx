'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Car,
  Loader2,
} from 'lucide-react';

interface Vehicle {
  _id: string;
  plateNumber: string;
  buildingName: string;
  unitNumber: string;
  make?: string;
  vehicleModel?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    unitNumber?: string;
    buildingName?: string;
  };
  createdBy?: {
    name: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const BUILDINGS = ['Tower A', 'Tower B', 'Tower C'];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
    page: 1,
  });
  const [searchInput, setSearchInput] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '10');
      if (filters.search) params.set('search', filters.search);
      if (filters.buildingName && filters.buildingName !== 'all') {
        params.set('buildingName', filters.buildingName);
      }

      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();

      if (data.success) {
        setVehicles(data.data.vehicles);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleBuildingFilter = (buildingName: string) => {
    setFilters((prev) => ({ ...prev, buildingName, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="h-8 w-8" />
            Vehicle Management
          </h1>
          <p className="text-muted-foreground">
            View all registered vehicles by residents
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchVehicles}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by plate number, owner..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select onValueChange={handleBuildingFilter} defaultValue="all">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {BUILDINGS.map((building) => (
              <SelectItem key={building} value={building}>
                {building}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate Number</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="hidden sm:table-cell">Building</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead className="hidden md:table-cell">Color</TableHead>
              <TableHead className="hidden lg:table-cell">Registered</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No vehicles registered yet.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle._id}>
                  <TableCell className="font-medium">
                    {vehicle.plateNumber}
                  </TableCell>
                  <TableCell>
                    {vehicle.ownerId ? (
                      <div>
                        <p className="font-medium">{vehicle.ownerId.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.ownerId.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {vehicle.buildingName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {vehicle.unitNumber}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {vehicle.color || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(vehicle.createdAt)}
                  </TableCell>
                  <TableCell>
                    {vehicle.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} vehicles
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

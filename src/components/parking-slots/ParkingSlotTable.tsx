'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ParkingSlotModal } from './ParkingSlotModal';
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  ParkingCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface ParkingSlot {
  _id: string;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
  currentVehicle?: string;
  createdAt: string;
}

interface ParkingSlotTableProps {
  slots: ParkingSlot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string) => void;
  onRefresh: () => void;
}

export function ParkingSlotTable({
  slots,
  pagination,
  onPageChange,
  onSearch,
  onStatusFilter,
  onRefresh,
}: ParkingSlotTableProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  const handleEdit = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSlot(null);
    setModalOpen(true);
  };

  const handleDelete = async (slot: ParkingSlot) => {
    if (slot.isOccupied) {
      toast.error('Cannot delete an occupied parking slot');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${slot.slotCode}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/parking-slots/${slot._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete parking slot');
      }

      toast.success('Parking slot deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by slot code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select onValueChange={onStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd}>
          <ParkingCircle className="h-4 w-4 mr-2" />
          Add Slot
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slot Code</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead className="hidden sm:table-cell">Current Vehicle</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No parking slots found.
                </TableCell>
              </TableRow>
            ) : (
              slots.map((slot) => (
                <TableRow key={slot._id}>
                  <TableCell className="font-medium">{slot.slotCode}</TableCell>
                  <TableCell>{slot.floor}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {slot.currentVehicle || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(slot.createdAt)}
                  </TableCell>
                  <TableCell>
                    {slot.isOccupied ? (
                      <Badge className="bg-red-100 text-red-800">Occupied</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(slot)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(slot)}
                          className="text-red-600"
                          disabled={slot.isOccupied}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} slots
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Parking Slot Modal */}
      <ParkingSlotModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        slot={selectedSlot}
        onSuccess={onRefresh}
      />
    </div>
  );
}

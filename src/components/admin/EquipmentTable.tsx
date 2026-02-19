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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EquipmentModal } from './EquipmentModal';
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

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

interface EquipmentTableProps {
  equipments: Equipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
}

export function EquipmentTable({
  equipments,
  pagination,
  onPageChange,
  onSearch,
  onRefresh,
}: EquipmentTableProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedEquipment(null);
    setModalOpen(true);
  };

  const handleDelete = async (equipment: Equipment) => {
    if (
      !confirm(
        `Are you sure you want to delete equipment ${equipment.equipmentId}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/equipments/${equipment._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete equipment');
      }

      toast.success('Equipment deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Make, Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button onClick={handleAdd}>
          <Wrench className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Maintenance Schedule</TableHead>
              <TableHead className="hidden md:table-cell">Operator</TableHead>
              <TableHead className="hidden lg:table-cell">Inventory</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No equipment found.
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((equipment) => (
                <TableRow key={equipment._id}>
                  <TableCell className="font-medium">
                    {equipment.equipmentId}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{equipment.make}</span>
                      <span className="text-sm text-muted-foreground">
                        {equipment.equipmentModel}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(equipment.preventativeMaintenanceSchedule)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {equipment.operatorDetails || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate" title={equipment.partsInventory}>
                    {equipment.partsInventory || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(equipment)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(equipment)}
                          className="text-red-600"
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
            {pagination.total} equipment
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

      {/* Equipment Modal */}
      <EquipmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        equipment={selectedEquipment}
        onSuccess={onRefresh}
      />
    </div>
  );
}

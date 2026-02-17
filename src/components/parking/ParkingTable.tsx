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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';
import { ExitModal } from './ExitModal';
import { Search, LogOut, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ParkingRecord {
  _id: string;
  plateNumber: string;
  buildingName: string;
  unitNumber: string;
  parkingSlot: string;
  status: 'parked' | 'exited';
  entryTimestamp: string;
  exitTimestamp?: string;
  duration?: number;
  createdBy?: {
    name: string;
  };
  updatedBy?: {
    name: string;
  };
}

interface ParkingTableProps {
  records: ParkingRecord[];
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

export function ParkingTable({
  records,
  pagination,
  onPageChange,
  onSearch,
  onStatusFilter,
  onRefresh,
}: ParkingTableProps) {
  const [search, setSearch] = useState('');
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(
    null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  const handleExit = (record: ParkingRecord) => {
    setSelectedRecord(record);
    setExitModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by plate, building, unit..."
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
            <SelectItem value="parked">Parked</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate Number</TableHead>
              <TableHead className="hidden md:table-cell">Building</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead className="hidden lg:table-cell">Slot</TableHead>
              <TableHead>Entry Time</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden lg:table-cell">Created By</TableHead>
              <TableHead className="hidden lg:table-cell">Exited By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No parking records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.plateNumber}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {record.buildingName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {record.unitNumber}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {record.parkingSlot}
                  </TableCell>
                  <TableCell>{formatDate(record.entryTimestamp)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {record.duration ? formatDuration(record.duration) : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {record.createdBy?.name || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {record.updatedBy?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {record.status === 'parked' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExit(record)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">
                            Exit
                          </span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </div>
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
            {pagination.total} records
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

      {/* Exit Modal */}
      <ExitModal
        open={exitModalOpen}
        onOpenChange={setExitModalOpen}
        record={selectedRecord}
        onSuccess={() => {
          setExitModalOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
}

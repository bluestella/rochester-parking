'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, User, Car, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Vehicle {
  _id: string;
  plateNumber: string;
  buildingName: string;
  unitNumber: string;
  make?: string;
  vehicleModel?: string;
  color?: string;
}

interface Resident {
  _id: string;
  name: string;
  email: string;
  unitNumber?: string;
  buildingName?: string;
  vehicles: Vehicle[];
}

interface ResidentSearchProps {
  onSelect: (data: {
    plateNumber: string;
    buildingName: string;
    unitNumber: string;
    vehicleId?: string;
    residentId?: string;
  }) => void;
}

export function ResidentSearch({ onSelect }: ResidentSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResidents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/residents/search?search=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Failed to search residents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchResidents(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchResidents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVehicle = (resident: Resident, vehicle: Vehicle) => {
    onSelect({
      plateNumber: vehicle.plateNumber,
      buildingName: vehicle.buildingName,
      unitNumber: vehicle.unitNumber,
      vehicleId: vehicle._id,
      residentId: resident._id,
    });
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="residentSearch">Search Resident</Label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="residentSearch"
          placeholder="Search by name, email, or unit..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && search.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No residents found
            </div>
          ) : (
            results.map((resident) => (
              <div key={resident._id} className="border-b last:border-b-0">
                {/* Resident Header */}
                <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{resident.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {resident.email}
                      {resident.buildingName && resident.unitNumber && (
                        <> • {resident.buildingName} - {resident.unitNumber}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Vehicles */}
                {resident.vehicles.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No vehicles registered
                  </div>
                ) : (
                  resident.vehicles.map((vehicle) => (
                    <button
                      key={vehicle._id}
                      onClick={() => handleSelectVehicle(resident, vehicle)}
                      className={cn(
                        'w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left',
                        'focus:outline-none focus:bg-accent'
                      )}
                    >
                      <Car className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{vehicle.plateNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.buildingName} - {vehicle.unitNumber}
                          {vehicle.color && <> • {vehicle.color}</>}
                          {vehicle.make && <> • {vehicle.make}</>}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Select
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

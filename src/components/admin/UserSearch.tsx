'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Resident {
  _id: string;
  name: string;
  email: string;
  unitNumber?: string;
  buildingName?: string;
}

interface UserSearchProps {
  onSelect: (user: Resident) => void;
  label?: string;
  placeholder?: string;
}

export function UserSearch({ 
  onSelect, 
  label = "Search User", 
  placeholder = "Search by name, email, or unit..." 
}: UserSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/residents/search?search=${encodeURIComponent(query)}&onlyUsers=true`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: Resident) => {
    onSelect(user);
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="userSearch">{label}</Label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="userSearch"
          placeholder={placeholder}
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

      {showDropdown && search.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No users found
            </div>
          ) : (
            results.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelect(user)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left border-b last:border-b-0"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                    {user.buildingName && user.unitNumber && (
                      <> • {user.buildingName} - {user.unitNumber}</>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  Select
                </Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

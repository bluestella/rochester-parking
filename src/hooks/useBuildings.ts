'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Building {
  _id: string;
  name: string;
  code: string;
  address?: string;
  floors: number;
}

interface UseBuildingsOptions {
  fetchOnMount?: boolean;
}

interface UseBuildingsReturn {
  buildings: Building[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBuildings(options: UseBuildingsOptions = {}): UseBuildingsReturn {
  const { fetchOnMount = true } = options;
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/buildings', {
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch buildings');
      }

      setBuildings(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchBuildings();
    }
  }, [fetchOnMount, fetchBuildings]);

  return {
    buildings,
    loading,
    error,
    refetch: fetchBuildings,
  };
}

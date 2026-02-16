'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'parked' | 'exited';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'parked') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Parked
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
      Exited
    </Badge>
  );
}

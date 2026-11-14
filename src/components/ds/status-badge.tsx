import { Badge } from '@/components/ui/badge';
import { label } from '@/lib/constants';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'line';

// One place decides what colour a state gets, across every module.
const TONES: Record<string, Tone> = {
  // settled / good
  paid: 'success', approved: 'success', resolved: 'success', confirmed: 'success',
  arrived: 'success', parked: 'success', free: 'success', active: 'success',
  // waiting on someone
  pending: 'warning', partial: 'warning', on_hold: 'warning', expected: 'warning', high: 'warning',
  maintenance: 'warning',
  // needs action now
  overdue: 'danger', rejected: 'danger', denied: 'danger', urgent: 'danger', emergency: 'danger',
  // in motion
  open: 'info', unpaid: 'info', in_progress: 'info', event: 'info', occupied: 'info',
  // finished or inert
  void: 'neutral', cancelled: 'neutral', closed: 'neutral', departed: 'neutral', exited: 'neutral',
  low: 'neutral', normal: 'neutral', notice: 'neutral', inactive: 'neutral',
};

export function toneFor(status: string): Tone {
  return TONES[status] ?? 'neutral';
}

export function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  return <Badge variant={toneFor(status)}>{children ?? label(status)}</Badge>;
}

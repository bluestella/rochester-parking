export interface VisitorPass {
  _id: string;
  code: string;
  visitorName: string;
  plateNumber?: string;
  purpose?: string;
  buildingName: string;
  unitNumber: string;
  hostId?: { name: string };
  expectedDate: string;
  status: string;
  arrivedAt?: string;
  departedAt?: string;
}

/** Today's calendar date in the viewer's timezone, as YYYY-MM-DD. */
export function todayString(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Visit dates are stored at noon UTC; show them without timezone drift. */
export function visitDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

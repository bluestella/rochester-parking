// Enumerations shared by models, validation and UI. Safe to import on the client.
export const UNIT_TYPES = ['studio', '1br', '2br', '3br', 'penthouse', 'commercial'] as const;
export const OCCUPANCY = ['owner_occupied', 'tenanted', 'vacant'] as const;
export const SLOT_TYPES = ['visitor', 'assigned', 'pwd', 'motorcycle'] as const;
export const CHARGE_KINDS = ['dues', 'parking', 'utility', 'amenity', 'penalty', 'other'] as const;
export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'e_wallet', 'check', 'card'] as const;
export const REQUEST_CATEGORIES = [
  'plumbing',
  'electrical',
  'aircon',
  'elevator',
  'common_area',
  'security',
  'noise',
  'other',
] as const;
export const REQUEST_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const REQUEST_STATUSES = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'] as const;
export const ANNOUNCEMENT_CATEGORIES = ['notice', 'maintenance', 'event', 'emergency'] as const;

const LABELS: Record<string, string> = {
  '1br': '1 bedroom',
  '2br': '2 bedroom',
  '3br': '3 bedroom',
  owner_occupied: 'Owner-occupied',
  pwd: 'PWD',
  e_wallet: 'E-wallet',
  bank_transfer: 'Bank transfer',
  aircon: 'Air conditioning',
  common_area: 'Common area',
  dues: 'Association dues',
  in_progress: 'In progress',
  on_hold: 'On hold',
};

export function label(value: string): string {
  return LABELS[value] ?? value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function options(values: readonly string[]) {
  return values.map((value) => ({ value, label: label(value) }));
}

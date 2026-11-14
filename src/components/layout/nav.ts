import {
  Bell,
  Building2,
  CalendarCheck,
  Car,
  CarFront,
  ClipboardList,
  DoorOpen,
  History,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Palette,
  ParkingCircle,
  ReceiptText,
  ScrollText,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const admin: NavGroup[] = [
  { items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Parking',
    items: [
      { label: 'Gate log', href: '/parking', icon: Car },
      { label: 'Deck map', href: '/parking/map', icon: LayoutGrid },
      { label: 'Visitors', href: '/parking/visitors', icon: DoorOpen },
      { label: 'Vehicles', href: '/admin/vehicles', icon: CarFront },
      { label: 'Slots', href: '/admin/parking-slots', icon: ParkingCircle },
    ],
  },
  {
    title: 'Finance',
    items: [{ label: 'Dues and billing', href: '/admin/billing', icon: ReceiptText }],
  },
  {
    title: 'Facilities',
    items: [
      { label: 'Amenities', href: '/admin/amenities', icon: CalendarCheck },
      { label: 'Service requests', href: '/admin/requests', icon: ClipboardList },
      { label: 'Equipment', href: '/admin/equipments', icon: Wrench },
    ],
  },
  {
    title: 'Property',
    items: [
      { label: 'Units', href: '/admin/units', icon: Home },
      { label: 'Buildings', href: '/admin/buildings', icon: Building2 },
      { label: 'People', href: '/admin/users', icon: Users },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Activity log', href: '/admin/logs', icon: ScrollText },
      { label: 'Design system', href: '/admin/design-system', icon: Palette },
    ],
  },
];

const guard: NavGroup[] = [
  {
    title: 'Gate',
    items: [
      { label: 'Gate log', href: '/parking', icon: Car },
      { label: 'Deck map', href: '/parking/map', icon: LayoutGrid },
      { label: 'Visitors', href: '/parking/visitors', icon: DoorOpen },
    ],
  },
];

const resident: NavGroup[] = [
  {
    items: [
      { label: 'Home', href: '/resident', icon: Home },
      { label: 'Dues', href: '/resident/dues', icon: ReceiptText },
      { label: 'Amenities', href: '/resident/bookings', icon: CalendarCheck },
      { label: 'Requests', href: '/resident/requests', icon: ClipboardList },
      { label: 'Visitors', href: '/resident/visitors', icon: DoorOpen },
      { label: 'Notices', href: '/resident/notices', icon: Bell },
      { label: 'Parking history', href: '/resident/history', icon: History },
    ],
  },
];

export function navFor(role: string): NavGroup[] {
  return role === 'admin' ? admin : role === 'guard' ? guard : resident;
}

/** The single item to mark as "you are here": the longest href that prefixes the path. */
export function activeHref(groups: NavGroup[], pathname: string): string | null {
  let best: string | null = null;
  for (const item of groups.flatMap((g) => g.items)) {
    const matches = pathname === item.href || pathname.startsWith(item.href + '/');
    if (matches && (!best || item.href.length > best.length)) best = item.href;
  }
  return best;
}

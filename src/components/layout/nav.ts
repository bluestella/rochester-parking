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
import { hasAnyPermission, type Permission } from '@/lib/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown when the user holds any of these. */
  needs: Permission[];
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const office: NavGroup[] = [
  { items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard, needs: ['dashboard:view'] }] },
  {
    title: 'Parking',
    items: [
      { label: 'Gate log', href: '/parking', icon: Car, needs: ['parking:read'] },
      { label: 'Deck map', href: '/parking/map', icon: LayoutGrid, needs: ['parking:read'] },
      { label: 'Visitors', href: '/parking/visitors', icon: DoorOpen, needs: ['visitors:manage'] },
      { label: 'Vehicles', href: '/admin/vehicles', icon: CarFront, needs: ['vehicles:read'] },
      { label: 'Slots', href: '/admin/parking-slots', icon: ParkingCircle, needs: ['parking_slots:read'] },
    ],
  },
  {
    title: 'Finance',
    items: [{ label: 'Dues and billing', href: '/admin/billing', icon: ReceiptText, needs: ['billing:read'] }],
  },
  {
    title: 'Facilities',
    items: [
      { label: 'Amenities', href: '/admin/amenities', icon: CalendarCheck, needs: ['amenities:manage', 'bookings:manage'] },
      { label: 'Service requests', href: '/admin/requests', icon: ClipboardList, needs: ['requests:read_all'] },
      { label: 'Equipment', href: '/admin/equipments', icon: Wrench, needs: ['equipment:read'] },
    ],
  },
  {
    title: 'Property',
    items: [
      { label: 'Units', href: '/admin/units', icon: Home, needs: ['units:read'] },
      { label: 'Buildings', href: '/admin/buildings', icon: Building2, needs: ['buildings:update'] },
      { label: 'People', href: '/admin/users', icon: Users, needs: ['users:update'] },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, needs: ['announcements:manage'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Activity log', href: '/admin/logs', icon: ScrollText, needs: ['audit:read'] },
      { label: 'Design system', href: '/admin/design-system', icon: Palette, needs: ['system:design'] },
    ],
  },
];

const guard: NavGroup[] = [
  {
    title: 'Gate',
    items: [
      { label: 'Gate log', href: '/parking', icon: Car, needs: ['parking:read'] },
      { label: 'Deck map', href: '/parking/map', icon: LayoutGrid, needs: ['parking:read'] },
      { label: 'Visitors', href: '/parking/visitors', icon: DoorOpen, needs: ['visitors:manage'] },
    ],
  },
];

const resident: NavGroup[] = [
  {
    items: [
      { label: 'Home', href: '/resident', icon: Home, needs: ['resident_portal:access'] },
      { label: 'Dues', href: '/resident/dues', icon: ReceiptText, needs: ['billing:read_own'] },
      { label: 'Amenities', href: '/resident/bookings', icon: CalendarCheck, needs: ['bookings:own'] },
      { label: 'Requests', href: '/resident/requests', icon: ClipboardList, needs: ['resident_portal:access'] },
      { label: 'Visitors', href: '/resident/visitors', icon: DoorOpen, needs: ['visitors:manage_own'] },
      { label: 'Notices', href: '/resident/notices', icon: Bell, needs: ['resident_portal:access'] },
      { label: 'Parking history', href: '/resident/history', icon: History, needs: ['parking:read_own'] },
    ],
  },
];

/** The navigation for a role: only the items it may open, and no empty groups. */
export function navFor(role: string): NavGroup[] {
  const base = role === 'resident' ? resident : role === 'guard' ? guard : office;
  return base
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyPermission(role, item.needs)),
    }))
    .filter((group) => group.items.length > 0);
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

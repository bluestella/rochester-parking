'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ds/theme-toggle';
import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { activeHref, navFor, type NavGroup } from './nav';

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-sm text-sidebar-foreground">
      {/* A parking bay seen from above: two painted lines and a kerb. */}
      <span aria-hidden className="flex h-7 w-7 items-end justify-between rounded-[3px] border-t-[3px] border-line px-[3px] pb-0">
        <span className="h-5 w-[3px] bg-line" />
        <span className="h-5 w-[3px] bg-line" />
        <span className="h-5 w-[3px] bg-line" />
      </span>
      <span className="leading-none">
        <span className="type-title block text-[1.3rem] tracking-wide">{brand.name}</span>
        <span className="mt-0.5 block text-[0.7rem] text-sidebar-muted">{brand.descriptor}</span>
      </span>
    </Link>
  );
}

function NavList({ groups, current, onNavigate }: { groups: NavGroup[]; current: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group, i) => (
        <div key={group.title ?? i}>
          {group.title && (
            <p className="mb-1 px-3 text-xs font-semibold text-sidebar-muted">{group.title}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === current;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {/* Painted line: you are here */}
                    {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-line" />}
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountPanel() {
  const { data: session } = useSession();
  if (!session) return null;
  const { user } = session;
  const where = user.unitNumber ? `${user.buildingName ?? ''} ${user.unitNumber}`.trim() : user.role;
  const row =
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring';

  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <div className="px-3 pb-2">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
        <p className="truncate text-xs capitalize text-sidebar-muted">{where}</p>
      </div>
      <ThemeToggle className={row} />
      <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className={row}>
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // Signed-out pages (login) render bare.
  if (!session || pathname === '/login') return <>{children}</>;

  const groups = navFor(session.user.role);
  const current = activeHref(groups, pathname);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar lg:flex">
        <div className="px-5 pb-2 pt-5">
          <Wordmark />
        </div>
        <NavList groups={groups} current={current} />
        <AccountPanel />
      </aside>

      {/* Mobile bar + drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-sidebar px-4 lg:hidden">
        <Wordmark />
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger
            className="rounded-md p-2 text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col bg-sidebar outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
            >
              <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <Wordmark />
                <DialogPrimitive.Close
                  className="rounded-md p-2 text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  aria-label="Close menu"
                >
                  <X className="size-5" aria-hidden />
                </DialogPrimitive.Close>
              </div>
              <NavList groups={groups} current={current} onNavigate={() => setOpen(false)} />
              <AccountPanel />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>

      <main id="main" className="min-w-0">
        {children}
      </main>
    </div>
  );
}

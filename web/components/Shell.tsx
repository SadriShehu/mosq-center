'use client';
import { Home, Landmark, LogOut, MapPin, Menu, ReceiptText, Search, User, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { CommandSearch } from '@/components/CommandSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { Me } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/user', label: sq.nav.home, icon: Home },
  { href: '/mbledhja', label: sq.nav.collection, icon: Landmark },
  { href: '/familjet', label: sq.nav.families, icon: Users },
  { href: '/lagjet', label: sq.nav.neighbourhoods, icon: MapPin },
  { href: '/pagesat', label: sq.nav.payments, icon: ReceiptText },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.ico" alt="" width={36} height={36} className="rounded-control bg-gold-soft p-1" />
      <span className="font-heading text-base font-extrabold text-sidebar-text">{sq.brand}</span>
    </div>
  );
}

function NavLinks({ year, onNavigate }: { year: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label={sq.nav.menu} className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname === `${href}.html`;
        return (
          <Link
            key={href}
            href={`${href}?viti=${year}`}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-text',
              active && 'bg-sidebar-active text-sidebar-text',
            )}
          >
            <Icon aria-hidden className={cn('size-5', active && 'text-gold')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function YearSelect({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now + 1; y >= now - 8; y--) years.push(y);
  if (!years.includes(year)) years.push(year);
  return (
    <div className="w-28">
      <Select aria-label={sq.year.label} value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {years.sort((a, b) => b - a).map((y) => <option key={y} value={y}>{y}</option>)}
      </Select>
    </div>
  );
}

function UserMenu({ user }: { user: Me }) {
  const initial = (user.name || '?').trim().charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={user.name}
          className="flex h-11 items-center gap-2 rounded-control px-2 hover:bg-success-soft"
        >
          <Avatar>
            {user.picture && <AvatarImage src={user.picture} alt="" />}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/user"><User aria-hidden /> {sq.nav.profile}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/logout" onClick={() => { document.cookie = 'auth-store=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'; }}>
            <LogOut aria-hidden /> {sq.nav.logout}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Frame({ user, children }: { user: Me; children: ReactNode }) {
  const [year, setYear] = useYear();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-control focus:bg-surface focus:px-3 focus:py-2">
        {sq.nav.skipToContent}
      </a>

      <aside className="on-dark fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar lg:flex">
        <Brand />
        <NavLinks year={year} />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="on-dark gap-0 bg-sidebar p-0 text-sidebar-text" closeClassName="text-sidebar-text hover:bg-sidebar-active">
          <SheetTitle className="sr-only">{sq.nav.menu}</SheetTitle>
          <SheetDescription className="sr-only">{sq.brand}</SheetDescription>
          <Brand />
          <NavLinks year={year} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={sq.nav.menu} onClick={() => setDrawer(true)}>
          <Menu />
        </Button>
        <Button
          variant="outline"
          className="min-w-0 flex-1 justify-start font-normal text-muted sm:max-w-sm sm:flex-none sm:w-80"
          aria-label={sq.command.open}
          onClick={() => setSearch(true)}
        >
          <Search aria-hidden />
          <span className="truncate">{sq.actions.search}…</span>
          <kbd className="ml-auto hidden rounded border border-border bg-ground px-1.5 py-0.5 text-xs font-sans font-medium text-muted sm:inline">Ctrl K</kbd>
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <YearSelect year={year} setYear={setYear} />
          <UserMenu user={user} />
        </div>
      </header>

      <CommandSearch open={search} onOpenChange={setSearch} year={year} />
      <main id="main" className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}

/** Authenticated layout. Wrap in <AuthGuard> (which passes `user`). Year lives in `?viti=`. */
export function AppShell({ user, children }: { user: Me; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Frame user={user}>{children}</Frame>
    </Suspense>
  );
}

/** Public layout (no session): brand + "Kyçu". */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.ico" alt="" width={32} height={32} />
          <span className="font-heading text-lg font-extrabold text-primary">{sq.brand}</span>
        </Link>
        <Button asChild>
          <a href="/login">{sq.nav.login}</a>
        </Button>
      </header>
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">{children}</main>
    </div>
  );
}

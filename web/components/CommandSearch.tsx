'use client';
import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { Home, Landmark, MapPin, ReceiptText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { sq } from '@/lib/sq';

const PAGES = [
  { label: sq.nav.home, href: '/user', icon: Home },
  { label: sq.nav.collection, href: '/mbledhja', icon: Landmark },
  { label: sq.nav.families, href: '/familjet', icon: Users },
  { label: sq.nav.neighbourhoods, href: '/lagjet', icon: MapPin },
  { label: sq.nav.payments, href: '/pagesat', icon: ReceiptText },
];

const itemClass =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-sm data-[selected=true]:bg-success-soft [&_svg]:size-4 [&_svg]:text-gold-ink';

/** Ctrl/⌘-K palette: jump to a page or to a family sheet (`/familjet?id=…`). Opened by AppShell. */
export function CommandSearch({ open, onOpenChange, year }: { open: boolean; onOpenChange: (o: boolean) => void; year: number }) {
  const router = useRouter();
  const families = useQuery({ queryKey: ['families', 'details'], queryFn: api.families.details, enabled: open, staleTime: 30_000 });
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-24 max-w-xl -translate-y-0 p-0">
        <DialogTitle className="sr-only">{sq.command.open}</DialogTitle>
        <DialogDescription className="sr-only">{sq.command.placeholder}</DialogDescription>
        <Command label={sq.command.open}>
          <Command.Input
            autoFocus
            placeholder={sq.command.placeholder}
            className="h-12 w-full border-b border-border bg-transparent px-4 pr-14 text-base outline-none"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted">{sq.command.empty}</Command.Empty>
            <Command.Group heading={sq.command.pages} className="text-xs text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5">
              {PAGES.map((p) => (
                <Command.Item key={p.href} value={`faqe ${p.label}`} className={itemClass} onSelect={() => go(`${p.href}?viti=${year}`)}>
                  <p.icon aria-hidden /> {p.label}
                </Command.Item>
              ))}
            </Command.Group>
            {(families.data?.length ?? 0) > 0 && (
              <Command.Group heading={sq.command.families} className="text-xs text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5">
                {families.data!.map((f) => {
                  const full = [f.name, f.middle_name, f.surname].filter(Boolean).join(' ');
                  return (
                    <Command.Item
                      key={f.id}
                      value={`${full} ${f.neighbourhood_name} ${f.id}`}
                      className={itemClass}
                      onSelect={() => go(`/familjet?id=${f.id}&viti=${year}`)}
                    >
                      <Users aria-hidden /> <span>{full}</span>
                      <span className="ml-auto text-xs text-muted">{f.neighbourhood_name}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

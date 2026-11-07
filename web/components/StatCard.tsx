import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

/** A KPI tile: label, big value, optional hint line and icon. Use on the dashboard and Mbledhja header. */
export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && <Icon aria-hidden className="size-5 text-gold-ink" />}
      </div>
      <p className="mt-1 font-heading text-2xl font-extrabold text-text sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </Card>
  );
}

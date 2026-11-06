import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

/** Every list needs one: say what is missing and what to do next (pass the action as `children`). */
export function EmptyState({ title, description, icon: Icon = Inbox, children }: {
  title: string; description?: string; icon?: LucideIcon; children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center">
      <Icon aria-hidden className="size-8 text-gold-ink" />
      <p className="font-heading text-base font-bold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

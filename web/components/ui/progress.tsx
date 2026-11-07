'use client';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** `value` 0..100. Pass `aria-label` (or aria-labelledby) so screen readers know what it measures. */
export function Progress({ className, value = 0, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const v = Math.round(Math.max(0, Math.min(100, value ?? 0)));
  return (
    <ProgressPrimitive.Root className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-success-soft', className)} value={v} {...props}>
      <ProgressPrimitive.Indicator className="h-full bg-primary transition-all" style={{ width: `${v}%` }} />
    </ProgressPrimitive.Root>
  );
}

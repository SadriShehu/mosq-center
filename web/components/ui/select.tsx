import { ChevronDown } from 'lucide-react';
import type { Ref, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Native <select> with shadcn styling. Native on purpose: best on phones, fully keyboard/screen-reader
 * accessible and selectable by role/label in tests (`selectOption`).
 */
export function Select({
  className, children, ref, ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-control border border-border bg-surface pl-3 pr-9 text-base text-text disabled:opacity-50 aria-[invalid=true]:border-danger sm:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

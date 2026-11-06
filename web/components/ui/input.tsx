import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text placeholder:text-muted disabled:opacity-50 aria-[invalid=true]:border-danger sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

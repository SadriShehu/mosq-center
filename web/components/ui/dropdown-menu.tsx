'use client';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuSeparator = ({ className, ...p }: ComponentProps<typeof DropdownPrimitive.Separator>) => (
  <DropdownPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...p} />
);
export const DropdownMenuLabel = ({ className, ...p }: ComponentProps<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label className={cn('px-3 py-2 text-xs text-muted', className)} {...p} />
);

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn('z-50 min-w-48 rounded-card border border-border bg-surface p-1 shadow-lg', className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

/** Use `asChild` with a <Link>/<a> to make a real navigation item. */
export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-text outline-none data-[highlighted]:bg-success-soft [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

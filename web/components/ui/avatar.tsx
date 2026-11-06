'use client';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root className={cn('relative inline-flex size-9 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}
export const AvatarImage = ({ className, ...p }: ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image className={cn('size-full object-cover', className)} {...p} />
);
export const AvatarFallback = ({ className, ...p }: ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback className={cn('flex size-full items-center justify-center bg-gold-soft text-sm font-bold text-gold-ink', className)} {...p} />
);

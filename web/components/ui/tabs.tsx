'use client';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('inline-flex rounded-control bg-success-soft p-1', className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-muted data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />;
}

'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { sq } from '@/lib/sq';
import { cn } from '@/lib/utils';
import { overlayClass } from './dialog';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export { DialogHeader as SheetHeader, DialogFooter as SheetFooter, DialogTitle as SheetTitle, DialogDescription as SheetDescription } from './dialog';

const sheetVariants = cva('fixed z-50 flex flex-col overflow-y-auto bg-surface p-6 shadow-xl', {
  variants: {
    side: {
      left: 'inset-y-0 left-0 w-[min(20rem,85vw)]',
      right: 'inset-y-0 right-0 w-[min(28rem,100vw)] border-l border-border',
    },
  },
  defaultVariants: { side: 'right' },
});

/** Side drawer: `left` for the mobile nav, `right` for the family sheet. */
export function SheetContent({
  className, children, side, closeClassName, ...props
}: ComponentProps<typeof DialogPrimitive.Content> & VariantProps<typeof sheetVariants> & { closeClassName?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close
          aria-label={sq.actions.close}
          className={cn('absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-control hover:bg-success-soft', closeClassName)}
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

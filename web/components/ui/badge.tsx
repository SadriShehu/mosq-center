import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { sq } from '@/lib/sq';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-success-soft text-primary',
      gold: 'bg-gold-soft text-gold-ink',
      danger: 'bg-danger-soft text-danger',
      outline: 'border border-border text-muted',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Paguar (green) / Pa paguar (red). Color is never the only signal: the text says it too. */
export function StatusBadge({ paid, className }: { paid: boolean; className?: string }) {
  return (
    <Badge variant={paid ? 'default' : 'danger'} className={className}>
      {paid ? sq.status.paid : sq.status.unpaid}
    </Badge>
  );
}

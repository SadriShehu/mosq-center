import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-hover',
        outline: 'border border-border bg-surface text-text hover:bg-success-soft',
        secondary: 'bg-success-soft text-primary hover:bg-border',
        ghost: 'text-text hover:bg-success-soft',
        danger: 'bg-danger text-white hover:opacity-90',
        'danger-soft': 'bg-danger-soft text-danger hover:opacity-90',
      },
      // min 44px touch target by default; "sm" is for dense desktop tables only
      size: { default: 'h-11 px-4', sm: 'h-9 px-3', icon: 'size-11' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}

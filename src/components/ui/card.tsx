import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground shadow-xs', className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4', className)} {...props} />
);

export const Badge = ({
  className,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'success' | 'danger' }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      tone === 'default' && 'bg-muted text-muted-foreground',
      tone === 'success' && 'bg-success/15 text-success',
      tone === 'danger' && 'bg-destructive/15 text-destructive',
      className
    )}
    {...props}
  />
);

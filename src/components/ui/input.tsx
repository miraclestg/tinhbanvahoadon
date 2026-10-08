import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 text-base text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldClass, 'h-11', className)} {...props} />
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldClass, 'min-h-24 py-2.5', className)} {...props} />
);
Textarea.displayName = 'Textarea';

/** Select gốc của trình duyệt (iOS hiển thị bộ chọn cuộn rất tiện), bọc theo kiểu shadcn */
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldClass, 'h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  )
);
NativeSelect.displayName = 'NativeSelect';

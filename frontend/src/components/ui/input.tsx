import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, type, ...props }, ref) => (
    <div className="relative w-full">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-200 hover:border-gray-300',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightIcon}
        </span>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  ),
);
Input.displayName = 'Input';

export { Input };

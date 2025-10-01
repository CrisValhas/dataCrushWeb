import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'borderless';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseDefault =
      'h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    const baseBorderless =
      'h-10 w-full rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';
    const base = variant === 'borderless' ? baseBorderless : baseDefault;
    const classes = `${base} ${className}`.trim();
    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = 'Input';

import React from 'react';

type Variant = 'default' | 'danger' | 'ghost';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
};

export function IconButton({ variant = 'default', size = 'sm', className = '', children, ...props }: Props) {
  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  // p-0 es crucial para sobreescribir el padding global aplicado a <button> en index.css
  const base = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 p-0';
  const variants: Record<Variant, string> = {
    default: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
    danger: 'bg-white border border-red-200 text-red-500 hover:bg-red-50',
    ghost: 'bg-transparent hover:bg-gray-50 text-gray-600',
  };
  return (
    <button className={`${base} ${sizeCls} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

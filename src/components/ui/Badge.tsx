import React from 'react';

type Variant = 'gray' | 'blue' | 'green' | 'purple' | 'red';
type Size = 'xs' | 'sm' | 'md';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

const sizeMap: Record<Size, string> = {
  xs: 'text-xs px-3 py-1.5',
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-3.5 py-2',
};

const variantMap: Record<Variant, string> = {
  gray: 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
};

export function Badge({ children, variant = 'gray', size = 'xs', className = '' }: Props) {
  const base = 'inline-flex items-center rounded-lg font-medium transition-colors';
  return (
    <span className={[base, sizeMap[size], variantMap[variant], className].join(' ').trim()}>
      {children}
    </span>
  );
}

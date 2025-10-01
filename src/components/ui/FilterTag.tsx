import React from 'react';

export type FilterTagProps = {
  active?: boolean;
  label: string;
  onClick?: () => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
};

const sizeMap = {
  xs: 'text-xs px-3 py-1.5',
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-3.5 py-2',
} as const;

export function FilterTag({ active = false, label, onClick, className = '', size = 'xs' }: FilterTagProps) {
  const base = 'inline-flex items-center rounded-lg font-medium cursor-pointer select-none transition-colors';
  const activeCls = 'bg-blue-50 text-blue-700 border border-blue-200';
  const inactiveCls = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';
  const classes = [base, sizeMap[size], active ? activeCls : inactiveCls, className].join(' ');
  return (
    <span role="button" tabIndex={0} onClick={onClick} className={classes}>
      {label}
    </span>
  );
}

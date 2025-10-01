import React from 'react';

type Props = React.LabelHTMLAttributes<HTMLLabelElement> & {
  requiredMark?: boolean;
};

export function Label({ className = '', requiredMark = false, children, ...props }: Props) {
  const base = 'block text-sm font-medium text-gray-700 mb-1';
  return (
    <label className={`${base} ${className}`.trim()} {...props}>
      {children}
      {requiredMark && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

type Props = {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
};

export function StatusPill({ label, variant }: Props) {
  const styles = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-700',
    neutral: 'bg-slate-100 text-slate-700',
  }[variant];
  return (
    <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full ${styles}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </span>
  );
}


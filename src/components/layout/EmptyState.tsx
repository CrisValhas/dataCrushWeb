export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed rounded-lg p-8 text-center text-slate-600">
      <p className="mb-4">{title}</p>
      {action}
    </div>
  );
}

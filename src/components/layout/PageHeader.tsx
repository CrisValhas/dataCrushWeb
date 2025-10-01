import { BrandIcon } from '../ui/BrandIcon';

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
      {description && <p className="text-sm text-gray-600 mt-0.5">{description}</p>}
    </div>
  );
}

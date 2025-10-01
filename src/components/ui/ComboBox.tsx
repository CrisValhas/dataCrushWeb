import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from './Input';

type Props = {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
};

export function ComboBox({ value, onChange, suggestions, placeholder, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    const uniq = Array.from(new Set(suggestions.filter(Boolean)));
    return uniq.filter(opt => opt.toLowerCase().includes(lower)).slice(0, 50);
  }, [suggestions, query]);

  const commit = (val: string) => {
    onChange(val);
    setQuery(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex items-center">
        <Input
          variant="borderless"
          value={query}
          placeholder={placeholder || 'Escribe o elegí...'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          className="-ml-10 p-2 text-gray-400 hover:text-gray-600 bg-transparent border-0 focus:outline-none"
          onClick={() => setOpen(o => !o)}
          tabIndex={-1}
          aria-label="Abrir sugerencias"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">Sin sugerencias</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => commit(opt)}
              >
                {opt}
              </div>
            ))
          )}
          {query && !filtered.includes(query) && (
            <div
              className="px-3 py-2 text-sm cursor-pointer text-blue-600 hover:bg-blue-50"
              onClick={() => commit(query)}
            >
              Usar "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

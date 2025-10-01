import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
};

export function SelectDropdown({ value, onChange, options, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const displayValue = value || placeholder || 'Seleccionar...';

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        className="w-full h-10 rounded-lg px-3 text-sm bg-white hover:bg-gray-50 flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 bg-transparent"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg max-h-48 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">Sin opciones disponibles</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === opt 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


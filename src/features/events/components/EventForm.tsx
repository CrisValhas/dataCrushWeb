import { RefObject } from 'react';
import { SelectDropdown } from '../../../components/ui/SelectDropdown';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/IntegrationButtons';
import { Label } from '../../../components/ui/Label';
import { ComboBox } from '../../../components/ui/ComboBox';

type Props = {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  actionType: string;
  setActionType: (v: string) => void;
  label: string;
  setLabel: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  categories: string[];
  actions: string[];
  labelSuggestions?: string[];
  onSave: () => void;
  nameInputRef?: RefObject<HTMLInputElement>;
  editingId: string | null;
  onDownloadDataLayers?: () => void;
  downloadingPdf?: boolean;
};

export function EventForm({
  name,
  setName,
  category,
  setCategory,
  actionType,
  setActionType,
  label,
  setLabel,
  location,
  setLocation,
  categories,
  actions,
  labelSuggestions = [],
  onSave,
  nameInputRef,
  editingId,
  onDownloadDataLayers,
  downloadingPdf = false,
}: Props) {
  const ga4Snippet = `// Inserta este código en tu sitio junto a gtag.js
gtag('event', '${name || 'custom_event'}', {
  event_category: '${category || 'CTA'}',
  event_label: '${label || 'Continue'}',
  event_action: '${actionType || 'click'}',
  location: '${location || 'step_1'}'
});`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(ga4Snippet);
      // El toast se muestra en el contenedor padre al guardar/acciones, aquí mantenemos simple
      // Si se desea, podemos exponer un onCopy prop para mostrar toast arriba.
    } catch {}
  };

  const downloadSnippet = () => {
    const blob = new Blob([ga4Snippet], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'custom_event'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label>Event Name</Label>
          <Input
            placeholder="e.g., cta_click"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            ref={nameInputRef as any}
          />
        </div>
        <div>
          <Label>Category</Label>
          <ComboBox
            value={category}
            onChange={setCategory}
            suggestions={categories}
            placeholder="Escribe o elegí..."
          />
        </div>
        <div>
          <Label>Action</Label>
          <ComboBox
            value={actionType}
            onChange={setActionType}
            suggestions={[...new Set([...actions, 'click', 'submit', 'view'])]}
            placeholder="click / submit / view"
          />
        </div>
        <div>
          <Label>Label</Label>
          <ComboBox
            value={label}
            onChange={setLabel}
            suggestions={labelSuggestions}
            placeholder="e.g., Continue"
          />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            placeholder="e.g., step_1"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
          />
        </div>
      </div>
      {/* Bloque de implementación GA4 */}
      <div className="mt-2 border rounded-lg bg-slate-50">
        <div className="px-3 pt-3">
          <div className="font-medium text-slate-700">Código dataLayer</div>
          <p className="text-xs text-slate-600 mt-1 mb-2">Copiá y pegá este snippet para enviar el evento a GA4 con gtag().</p>
          <pre className="bg-white text-slate-800 text-xs p-3 rounded border overflow-auto"><code>{ga4Snippet}</code></pre>
        </div>
        <div className="flex items-center gap-2 p-3 border-t bg-white rounded-b-lg">
          <Button variant="reauthorize" size="sm" onClick={copySnippet}>Copiar al portapapeles</Button>
          <Button variant="connect" size="sm" onClick={downloadSnippet}>Descargar archivo</Button>
          {onDownloadDataLayers && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1 whitespace-nowrap"
              onClick={onDownloadDataLayers}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? 'Generando PDF…' : 'Descargar DataLayers (PDF)'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Button
          variant="connect"
          fullWidth
          size="md"
          onClick={onSave}
        >
          {editingId ? 'Actualizar Evento' : 'Crear Evento'}
        </Button>
      </div>
    </div>
  );
}

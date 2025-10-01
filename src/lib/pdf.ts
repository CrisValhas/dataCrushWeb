import jsPDF from 'jspdf';

export type PDFEvent = {
  frameId: string;
  frameName: string;
  eventName: string;
  category?: string;
  actionType?: string;
  label?: string;
  location?: string;
  regionRect?: { xPct: number; yPct: number; wPct: number; hPct: number } | null;
  implemented?: boolean;
};

type PDFFrame = { id: string; name: string; thumbUrl?: string | null };

type PdfOptions = {
  projectName?: string;
  measurementId?: string; // opcional, si está disponible
  projectId?: string; // necesario para fallback de export de imagen por frame
};

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
let CACHED_ACCESS_TOKEN: string | null = null;
let LAST_TOKEN_TS = 0;

async function getAccessToken(): Promise<string | null> {
  // Reusar por ~2 minutos
  const now = Date.now();
  if (CACHED_ACCESS_TOKEN && now - LAST_TOKEN_TS < 120_000) return CACHED_ACCESS_TOKEN;
  try {
    const r = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!r.ok) return null;
    const json = await r.json();
    const token = json?.data?.accessToken || null;
    if (token) {
      CACHED_ACCESS_TOKEN = token;
      LAST_TOKEN_TS = now;
    }
    return token;
  } catch {
    return null;
  }
}

async function urlToDataUrl(url: string): Promise<string | null> {
  const isApiUrl = typeof url === 'string' && url.startsWith(API_URL);

  // Si es nuestro backend protegido por JWT, intentar con Authorization Bearer (obtenido vía refresh cookie)
  if (isApiUrl) {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      let res = await fetch(url, { credentials: 'include', headers });
      if (res.status === 401) {
        // Reintentar forzando refresh
        CACHED_ACCESS_TOKEN = null; LAST_TOKEN_TS = 0;
        const retryToken = await getAccessToken();
        const retryHeaders: Record<string, string> = retryToken ? { Authorization: `Bearer ${retryToken}` } : {};
        res = await fetch(url, { credentials: 'include', headers: retryHeaders });
      }
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {}
  }

  // Intentar vía Image + canvas con CORS (si el servidor lo permite)
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const cw = img.naturalWidth || (img as any).width || 256;
          const ch = img.naturalHeight || (img as any).height || 256;
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No canvas context'));
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e as any);
      img.src = url;
    });
    return dataUrl;
  } catch {}

  // Fallback a fetch + blob
  try {
    const headers: Record<string, string> = {};
    if (isApiUrl) {
      const token = await getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { credentials: isApiUrl ? 'include' : 'omit', headers });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    // Si es SVG, rasterizar a PNG para compatibilidad con jsPDF
    if (blob.type === 'image/svg+xml' || url.endsWith('.svg')) {
      const svgText = await blob.text();
      const svg64 = btoa(unescape(encodeURIComponent(svgText)));
      const svgUrl = `data:image/svg+xml;base64,${svg64}`;
      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 256;
            canvas.height = img.naturalHeight || 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No canvas context'));
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) { reject(e); }
        };
        img.onerror = (e) => reject(e as any);
        img.src = svgUrl;
      });
    }
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function tryLoadLogo(): Promise<string | null> {
  // Intentar logo dedicado, fallback al favicon público
  const candidates = ['/datacrush-logo.png', '/favicon.svg', '/favicon.png'];
  for (const url of candidates) {
    // Intento sin y con cache-buster para evitar caché vieja
    const variants = [url, `${url}?v=dc-logo`];
    for (const v of variants) {
      const data = await urlToDataUrl(v);
      if (data) return data;
    }
  }
  return null;
}

function drawHeaderFooter(doc: jsPDF, pageIndex: number, total: number, projectName: string, logoDataUrl: string | null) {
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight() };
  const headerH = 36;
  const footerH = 28;
  const padX = 40;

  // Header bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, page.width, headerH, 'F');
  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(logoDataUrl, fmt as any, padX, 8, 20, 20);
    } catch {}
  }
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const title = `DataCrush — ${projectName}`;
  doc.text(title, padX + 28, 22);

  // Footer bar
  doc.setFillColor(248, 250, 252);
  doc.rect(0, page.height - footerH, page.width, footerH, 'F');
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const date = new Date().toLocaleString();
  doc.text(`Generado: ${date}`, padX, page.height - 10);
  const pageLabel = `Página ${pageIndex} de ${total}`;
  const w = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, page.width - padX - w, page.height - 10);
}

export async function generateDataLayersPDF(fileName: string, frames: PDFFrame[], events: PDFEvent[], options: PdfOptions = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight() };
  const headerH = 36; // reservado para header fijo
  const footerH = 28; // reservado para footer fijo
  const margin = { x: 48, y: headerH + 32 }; // más margen superior/lateral para evitar solapes

  const projectName = options.projectName || 'Proyecto';
  const logoDataUrl = await tryLoadLogo();

  // Portada con guía GA4
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Código dataLayer', margin.x, margin.y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('El código dataLayer está listo para ser implementado en tu sitio web.', margin.x, margin.y + 18);
  doc.text('Pegalo en el <head> y usa gtag() para enviar eventos desde tu app.', margin.x, margin.y + 34);

  const snippet = `<!-- Header (gtag base) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${options.measurementId || 'GA_MEASUREMENT_ID'}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${options.measurementId || 'GA_MEASUREMENT_ID'}');\n  // Ejemplo de evento\n  gtag('event', 'login', { method: 'Google' });\n</script>`;

  // Caja de código
  const codeTop = margin.y + 50;
  const codeW = page.width - margin.x * 2;
  const codeH = 140;
  doc.setDrawColor(220);
  doc.roundedRect(margin.x - 6, codeTop - 14, codeW + 12, codeH + 28, 8, 8, 'S');
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(snippet, codeW - 16);
  doc.text(lines, margin.x, codeTop);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Tip: reemplazá GA_MEASUREMENT_ID por tu ID (ej: G-XXXXXX).', margin.x, codeTop + codeH + 24);

  // Nueva página para comenzar con los frames
  if (frames.length > 0) doc.addPage();

  for (let idx = 0; idx < frames.length; idx++) {
    const frame = frames[idx];
    if (idx > 0) doc.addPage();

    // Título de página
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const headerY = margin.y; // lejos del header fijo
    doc.text(`Pantalla: ${frame.name}`, margin.x, headerY);

    // Preview del frame
    const previewTop = headerY + 16; // evitar solapamiento con el título
    const maxImgW = page.width - margin.x * 2;
    const maxImgH = 320; // alto máximo disponible para preview

    let imgH = 0;
    let previewBottom = previewTop;
    {
      let dataUrl: string | null = null;
      // Intentar con thumbUrl si existe (vía proxy del backend para evitar CORS)
      if (frame.thumbUrl) {
        const proxyUrl = `${API_URL}/integrations/figma/image-proxy?url=${encodeURIComponent(frame.thumbUrl)}`;
        dataUrl = await urlToDataUrl(proxyUrl);
      }
      // Fallback: export directo por nodeId si no hay thumbUrl o falló
      if (!dataUrl && options.projectId) {
        const directUrl = `${API_URL}/integrations/figma/frame-image?projectId=${encodeURIComponent(options.projectId)}&nodeId=${encodeURIComponent(frame.id)}&scale=2&format=png`;
        dataUrl = await urlToDataUrl(directUrl);
      }
      if (dataUrl) {
        // Insertar imagen manteniendo aspecto, ajustada al área disponible (maxImgW x maxImgH)
        try {
          // Cargar dimensiones reales del dataUrl
          const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve({ w: im.naturalWidth || im.width, h: im.naturalHeight || im.height });
            im.onerror = (e) => reject(e);
            im.src = dataUrl;
          }).catch(() => ({ w: maxImgW, h: maxImgH })) as { w: number; h: number };

          const ratio = dims.w > 0 && dims.h > 0 ? dims.w / dims.h : maxImgW / maxImgH;
          const scale = Math.min(maxImgW / dims.w, maxImgH / dims.h);
          const drawW = Math.max(1, dims.w * scale);
          const drawH = Math.max(1, dims.h * scale);
          // Centrar horizontalmente dentro del rectángulo disponible
          const drawX = margin.x + (maxImgW - drawW) / 2;
          const drawY = previewTop; // pegado arriba del área

          imgH = drawH;
          const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(dataUrl, fmt as any, drawX, drawY, drawW, drawH);

          // Overlays de eventos en esta pantalla usando dimensiones de dibujo
          const list = events.filter((e) => e.frameId === frame.id && e.regionRect);
          list.forEach((ev) => {
            const rr = ev.regionRect!;
            const x = drawX + rr.xPct * drawW;
            const y = drawY + rr.yPct * drawH;
            const w = rr.wPct * drawW;
            const h = rr.hPct * drawH;

            const isImpl = Boolean(ev.implemented);
            const stroke = isImpl ? [46, 204, 113] : [255, 159, 67];
            const fill = isImpl ? [46, 204, 113, 0.15] : [255, 159, 67, 0.15];

            doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
            doc.setFillColor(fill[0], fill[1], fill[2]);
            doc.rect(x, y, w, h, 'D');

            // etiqueta encima del rectángulo (clamp al ancho disponible)
            const label = ev.eventName;
            const padX = 4;
            const padY = 2;
            const maxLabelW = Math.min(drawW, maxImgW);
            const lblW = Math.min(doc.getTextWidth(label) + padX * 2, maxLabelW);
            const lblH = 12 + padY * 2;
            const lblX = x;
            const lblY = Math.max(drawY + 2, y - lblH - 2);
            const bg = isImpl ? [39, 174, 96] : [243, 156, 18];
            doc.setFillColor(bg[0], bg[1], bg[2]);
            doc.rect(lblX, lblY, lblW, lblH, 'F');
            doc.setTextColor(255);
            doc.setFontSize(10);
            doc.text(label, lblX + padX, lblY + 10 + padY / 2);
            doc.setTextColor(0);
          });

          previewBottom = drawY + drawH;
        } catch {
          // Fallback: sin imagen
          doc.setDrawColor(220);
          doc.rect(margin.x, previewTop, maxImgW, maxImgH, 'S');
          doc.setTextColor(120);
          doc.text('Preview no disponible', margin.x + 8, previewTop + 16);
          doc.setTextColor(0);
          imgH = maxImgH;
          previewBottom = previewTop + imgH;
        }
      } else {
        // Fallback por error de carga
        doc.setDrawColor(220);
        doc.rect(margin.x, previewTop, maxImgW, maxImgH, 'S');
        doc.setTextColor(120);
        doc.text('Preview no disponible', margin.x + 8, previewTop + 16);
        doc.setTextColor(0);
        imgH = maxImgH;
        previewBottom = previewTop + imgH;
      }
    }

    // Detalle por evento de la página
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const list = events.filter((e) => e.frameId === frame.id);
    let y = previewBottom + 28; // más espacio después de la imagen
    if (list.length === 0) {
      doc.setTextColor(120);
      doc.text('Sin eventos asociados.', margin.x, y);
      doc.setTextColor(0);
      continue;
    }

    list.forEach((ev, i) => {
      // Construir el contenido para calcular alturas dinámicas
      const metaLineY = 16;
      const secondMetaLineY = 32;
      const locationLineY = ev.location ? 48 : 48; // reservamos espacio aunque no haya location
      const codeStartOffset = ev.location ? 64 : 56;

      // Snippet GA4 por evento (courier)
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      const evSnippet = `gtag('event', '${ev.eventName}', {\n  event_category: '${ev.category || ''}',\n  event_label: '${ev.label || ''}',\n  event_action: '${ev.actionType || ''}',\n  location: '${ev.location || ''}'\n});`;
      const codeLines = doc.splitTextToSize(evSnippet, page.width - margin.x * 2 - 20);
      const lineHeight = 12; // px
      const codeBlockH = codeLines.length * lineHeight + 8; // pequeño padding inferior

      // Altura total de la caja
      const baseBoxH = codeStartOffset + codeBlockH + 20; // padding inferior extra

      // Salto de página si no entra
      if (y + baseBoxH > page.height - footerH - 24) {
        doc.addPage();
        y = margin.y; // reset en nueva página
      }

      // Caja de detalle
      doc.setDrawColor(220);
      doc.roundedRect(margin.x - 4, y - 14, page.width - margin.x * 2 + 8, baseBoxH + 14, 6, 6, 'S');

      // Título y metadatos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text(`${i + 1}. ${ev.eventName}`, margin.x, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Categoria: ${ev.category || '-'}`, margin.x, y + metaLineY);
      doc.text(`Action: ${ev.actionType || '-'}`, margin.x + 200, y + metaLineY);
      doc.text(`Label: ${ev.label || '-'}`, margin.x + 360, y + metaLineY);
      if (ev.location) doc.text(`Location: ${ev.location}`, margin.x, y + secondMetaLineY);

      // Pill de estado: solo si implemented viene definido
      if (typeof ev.implemented !== 'undefined') {
        const isImpl = Boolean(ev.implemented);
        const statusTxt = isImpl ? 'Implementado' : 'Pendiente';
        const statusColor = isImpl ? [39, 174, 96] : [243, 156, 18];
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.rect(page.width - margin.x - 110, y - 12, 110, 22, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(statusTxt, page.width - margin.x - 100, y + 3);
        doc.setTextColor(0);
      }

      // Snippet
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.text(codeLines, margin.x, y + codeStartOffset);

      // Siguiente bloque con separación adicional
      y += baseBoxH + 16;
    });
  }

  // Dibujar header y footer en todas las páginas al final
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawHeaderFooter(doc, p, total, projectName, logoDataUrl);
  }

  doc.save(fileName);
}

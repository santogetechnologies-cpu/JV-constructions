// PDF to Image conversion helper using PDF.js
// Renders vector/scanned PDF blueprint pages to high-resolution PNG images
// so they can be treated identically to image blueprints (erasing, tracing, auto-detect, pan/zoom).

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export async function ensurePdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF conversion only supported in browser');
  }

  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    // Check if script tag is already being loaded
    const existingScript = document.querySelector('script[src*="pdf.js"]') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js script loaded but window.pdfjsLib is undefined'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load PDF.js script')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js script loaded but window.pdfjsLib is missing'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Render first page of a PDF (File, ArrayBuffer, or URL) to a high-res HTMLCanvasElement.
 */
export async function renderPdfToCanvas(
  source: File | ArrayBuffer | string,
  scale = 2.0
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const pdfjs = await ensurePdfJs();

  let loadingTask: any;
  if (source instanceof File) {
    const arrayBuffer = await source.arrayBuffer();
    loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  } else if (source instanceof ArrayBuffer) {
    loadingTask = pdfjs.getDocument({ data: source });
  } else {
    // URL string
    loadingTask = pdfjs.getDocument({ url: source, withCredentials: false });
  }

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Compute scale so image is crisp (target ~2000-3000px width/height for blueprint clarity)
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  let finalScale = scale;
  if (unscaledViewport.width > 0) {
    // If original width is ~600px, 2.5x -> 1500px, if original is 1200px -> 2400px
    const idealWidth = 2400;
    finalScale = Math.max(1.5, Math.min(idealWidth / unscaledViewport.width, 3.0));
  }

  const viewport = page.getViewport({ scale: finalScale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context for PDF rendering');

  // Fill with crisp white background first
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Converts a PDF File into a standard PNG Image File and DataURL
 * for identical handling to JPG/PNG blueprint uploads.
 */
export async function convertPdfToImageFile(
  pdfFile: File,
  scale = 2.5
): Promise<{ file: File; width: number; height: number; dataUrl: string }> {
  const { canvas, width, height } = await renderPdfToCanvas(pdfFile, scale);

  const dataUrl = canvas.toDataURL('image/png');

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create PNG blob from canvas'));
      },
      'image/png',
      0.95
    );
  });

  const baseName = pdfFile.name.replace(/\.[^/.]+$/, '');
  const imageFileName = `${baseName}_converted.png`;
  const imageFile = new File([blob], imageFileName, { type: 'image/png' });

  return {
    file: imageFile,
    width,
    height,
    dataUrl,
  };
}

/**
 * Converts a remote PDF URL into a PNG data URL for display in <img />
 */
export async function convertPdfUrlToDataUrl(
  pdfUrl: string,
  scale = 2.0
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { canvas, width, height } = await renderPdfToCanvas(pdfUrl, scale);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

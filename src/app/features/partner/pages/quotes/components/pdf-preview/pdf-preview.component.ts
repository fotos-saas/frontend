import {
  Component, input, signal, effect, ElementRef, viewChild,
  ChangeDetectionStrategy, OnDestroy,
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Worker beállítás — assets-ből, CSP-kompatibilis
pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.mjs';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  template: `
    <div class="pdf-canvas-wrapper" #wrapper>
      @if (loading()) {
        <div class="pdf-loading-overlay">
          <div class="pdf-spinner"></div>
          <span>PDF betöltése...</span>
        </div>
      }
      @if (error()) {
        <div class="pdf-error">
          <span>Nem sikerült betölteni a PDF-et.</span>
        </div>
      }
      @for (page of pages(); track page) {
        <canvas class="pdf-page-canvas"></canvas>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pdf-canvas-wrapper {
      position: relative;
      min-height: 200px;
      background: #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
    }
    .pdf-page-canvas {
      max-width: 100%;
      height: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border-radius: 2px;
    }
    .pdf-loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 40px;
      color: #64748b;
      font-size: 0.875rem;
    }
    .pdf-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .pdf-error {
      padding: 40px;
      color: #ef4444;
      font-size: 0.875rem;
      text-align: center;
    }
    @media (prefers-reduced-motion: reduce) {
      .pdf-spinner { animation-duration: 0.01ms !important; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPreviewComponent implements OnDestroy {
  /** A PDF adatforrás blob-ként */
  pdfBlob = input.required<Blob | null>();

  protected loading = signal(false);
  protected error = signal(false);
  protected pages = signal<number[]>([]);

  private wrapperRef = viewChild<ElementRef<HTMLDivElement>>('wrapper');
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private renderTask: ReturnType<typeof setTimeout> | null = null;

  private readonly renderEffect = effect(() => {
    const blob = this.pdfBlob();
    if (blob) {
      // Kis késleltetés, hogy a DOM frissüljön
      this.renderTask = setTimeout(() => this.renderPdf(blob), 50);
    }
  });

  ngOnDestroy(): void {
    if (this.renderTask) clearTimeout(this.renderTask);
    this.pdfDoc?.destroy();
  }

  private async renderPdf(blob: Blob): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.pages.set([]);

    try {
      const arrayBuffer = await blob.arrayBuffer();
      this.pdfDoc?.destroy();
      this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const numPages = this.pdfDoc.numPages;
      this.pages.set(Array.from({ length: numPages }, (_, i) => i + 1));

      // Kis delay, hogy a canvas-ok renderelődjenek a DOM-ba
      await new Promise(r => setTimeout(r, 50));

      const wrapper = this.wrapperRef()?.nativeElement;
      if (!wrapper) return;

      const canvases = wrapper.querySelectorAll<HTMLCanvasElement>('.pdf-page-canvas');
      const containerWidth = wrapper.clientWidth - 24; // padding levonása

      for (let i = 0; i < numPages; i++) {
        const page = await this.pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvases[i];
        if (!canvas) continue;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({ canvas, viewport: scaledViewport }).promise;
      }

      this.loading.set(false);
    } catch {
      this.loading.set(false);
      this.error.set(true);
    }
  }
}

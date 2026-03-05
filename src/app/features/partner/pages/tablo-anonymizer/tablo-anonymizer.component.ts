import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ElectronService } from '../../../../core/services/electron.service';
import { FormsModule } from '@angular/forms';
import type { AnonymizeFaceRect, AnonymizeSettings } from '../../../../core/services/electron.types';

interface TabloImage {
  name: string;
  path: string;
  size: number;
  faces?: AnonymizeFaceRect[];
  faceCount?: number;
  status: 'pending' | 'detecting' | 'detected' | 'processing' | 'done' | 'error';
  error?: string;
  outputPath?: string;
}

type ProcessStep = 'select' | 'detect' | 'review' | 'processing' | 'done';

@Component({
  selector: 'app-tablo-anonymizer',
  standalone: true,
  imports: [LucideAngularModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tablo-anonymizer.component.html',
  styleUrl: './tablo-anonymizer.component.scss',
})
export class TabloAnonymizerComponent {
  private readonly electron = inject(ElectronService);
  readonly ICONS = ICONS;

  // Állapot
  readonly step = signal<ProcessStep>('select');
  readonly workDir = signal<string>('');
  readonly images = signal<TabloImage[]>([]);
  readonly isProcessing = signal(false);
  readonly processProgress = signal(0);

  // Beállítások
  readonly anonMode = signal<'blur' | 'rect'>('blur');
  readonly rectColor = signal('#888888');
  readonly rectOpacity = signal(1.0);
  readonly jpgQuality = signal(95);

  // Számított értékek
  readonly totalImages = computed(() => this.images().length);
  readonly detectedImages = computed(() => this.images().filter(i => i.status === 'detected' || i.status === 'done').length);
  readonly totalFaces = computed(() => this.images().reduce((sum, i) => sum + (i.faceCount || 0), 0));
  readonly doneImages = computed(() => this.images().filter(i => i.status === 'done').length);
  readonly hasErrors = computed(() => this.images().some(i => i.status === 'error'));

  async selectFolder(): Promise<void> {
    const api = window.electronAPI;
    if (!api) return;

    const result = await api.anonymizer.selectWorkDir();
    if (result.cancelled || !result.path) return;

    if (result.error) {
      return;
    }

    this.workDir.set(result.path);
    this.images.set(
      (result.images || []).map(img => ({
        ...img,
        status: 'pending' as const,
      }))
    );
    this.step.set('detect');
  }

  async detectAllFaces(): Promise<void> {
    const api = window.electronAPI;
    if (!api || !this.workDir()) return;

    this.isProcessing.set(true);
    const imgs = [...this.images()];

    // Képenként detektálunk (progress jelzés miatt)
    for (let i = 0; i < imgs.length; i++) {
      imgs[i] = { ...imgs[i], status: 'detecting' };
      this.images.set([...imgs]);

      const result = await api.anonymizer.detect({ inputPath: imgs[i].path });

      if (result.success && result.faces) {
        imgs[i] = {
          ...imgs[i],
          status: 'detected',
          faces: result.faces,
          faceCount: result.face_count || result.faces.length,
        };
      } else {
        imgs[i] = {
          ...imgs[i],
          status: 'error',
          error: result.error || 'Detektálás sikertelen',
          faceCount: 0,
        };
      }
      this.images.set([...imgs]);
      this.processProgress.set(Math.round(((i + 1) / imgs.length) * 100));
    }

    this.isProcessing.set(false);
    this.processProgress.set(0);
    this.step.set('review');
  }

  async processAll(): Promise<void> {
    const api = window.electronAPI;
    if (!api || !this.workDir()) return;

    this.isProcessing.set(true);
    this.step.set('processing');
    const imgs = [...this.images()];

    const settings: AnonymizeSettings = {
      mode: this.anonMode(),
      color: this.rectColor(),
      opacity: this.rectOpacity(),
      quality: this.jpgQuality(),
    };

    for (let i = 0; i < imgs.length; i++) {
      if (!imgs[i].faces || imgs[i].faces!.length === 0) {
        imgs[i] = { ...imgs[i], status: 'done' };
        this.images.set([...imgs]);
        continue;
      }

      imgs[i] = { ...imgs[i], status: 'processing' };
      this.images.set([...imgs]);

      const result = await api.anonymizer.process({
        inputPath: imgs[i].path,
        faces: imgs[i].faces!,
        settings,
      });

      if (result.success) {
        imgs[i] = { ...imgs[i], status: 'done', outputPath: result.outputPath };
      } else {
        imgs[i] = { ...imgs[i], status: 'error', error: result.error };
      }
      this.images.set([...imgs]);
      this.processProgress.set(Math.round(((i + 1) / imgs.length) * 100));
    }

    this.isProcessing.set(false);
    this.processProgress.set(0);
    this.step.set('done');
  }

  async openOutputFolder(): Promise<void> {
    const api = window.electronAPI;
    if (!api) return;

    const outputDir = this.workDir() + '/anonymized';
    await api.photoshop.revealInFinder(outputDir);
  }

  reset(): void {
    this.step.set('select');
    this.workDir.set('');
    this.images.set([]);
    this.processProgress.set(0);
    this.isProcessing.set(false);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getStatusIcon(status: TabloImage['status']): string {
    switch (status) {
      case 'pending': return this.ICONS.IMAGE;
      case 'detecting': return this.ICONS.LOADER;
      case 'detected': return this.ICONS.SCAN_FACE;
      case 'processing': return this.ICONS.LOADER;
      case 'done': return this.ICONS.CHECK;
      case 'error': return this.ICONS.ALERT_TRIANGLE;
      default: return this.ICONS.IMAGE;
    }
  }

  getStatusLabel(status: TabloImage['status']): string {
    switch (status) {
      case 'pending': return 'Várakozik';
      case 'detecting': return 'Arcok keresése...';
      case 'detected': return 'Arcok felismerve';
      case 'processing': return 'Anonimizálás...';
      case 'done': return 'Kész';
      case 'error': return 'Hiba';
      default: return '';
    }
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  output,
  signal,
  computed,
  OnDestroy,
  inject,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  ComponentRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { formatFileSize } from '@shared/utils/formatters.util';
import { MediaLightboxComponent, LightboxMediaItem } from '@shared/components/media-lightbox';
import { PsFieldSize, PsFieldState } from '../form.types';

export interface PsFilePreview {
  file: File;
  previewUrl: string;
  name: string;
  size: string;
}

let nextUploadId = 0;

@Component({
  selector: 'ps-file-upload',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-file-upload.component.html',
  styleUrl: './ps-file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsFileUploadComponent),
      multi: true,
    },
  ],
  host: {
    '(window:dragover)': 'onWindowDrag($event)',
    '(window:drop)': 'onWindowDrag($event)',
  },
})
export class PsFileUploadComponent implements ControlValueAccessor, OnDestroy {
  readonly ICONS = ICONS;

  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private lightboxRef: ComponentRef<MediaLightboxComponent> | null = null;

  // --- Közös ps-field inputok ---
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');

  // --- Upload-specifikus inputok ---
  readonly accept = input<string>('.jpg,.jpeg,.png,.webp');
  readonly acceptLabel = input<string>('JPG, PNG, WebP');
  readonly maxFiles = input<number>(10);
  readonly maxSizeMB = input<number>(20);
  readonly multiple = input<boolean>(true);
  readonly variant = input<'default' | 'compact' | 'mini'>('default');
  readonly dropzoneText = input<string>('');
  readonly dropzoneHint = input<string>('');

  readonly uploadError = output<string>();

  // --- Belső állapot ---
  readonly files = signal<PsFilePreview[]>([]);
  readonly isDragging = signal(false);
  private cvaDisabled = signal(false);

  // --- Lightbox ---
  readonly lightboxMedia = computed<LightboxMediaItem[]>(() =>
    this.files()
      .filter(f => f.previewUrl)
      .map((f, i) => ({ id: i, url: f.previewUrl, fileName: f.name }))
  );

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly uniqueId = computed(() => `ps-upload-${nextUploadId++}`);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly maxFileSize = computed(() => this.maxSizeMB() * 1024 * 1024);
  readonly canAddMore = computed(() =>
    this.multiple() ? this.files().length < this.maxFiles() : this.files().length === 0
  );
  readonly fileCountLabel = computed(() => {
    const count = this.files().length;
    return count === 0
      ? '0 fájl kiválasztva'
      : `${count} fájl kiválasztva`;
  });

  readonly computedState = computed<PsFieldState>(() => {
    const s = this.state();
    if (s !== 'default') return s;
    if (this.errorMessage()) return 'error';
    return 'default';
  });

  readonly sizeClass = computed(() => {
    const s = this.size();
    return s === 'full' ? 'ps-field--full' : `ps-field--${s}`;
  });

  readonly hostClasses = computed(() => {
    const cs = this.computedState();
    return {
      'ps-field': true,
      [this.sizeClass()]: true,
      'ps-field--error': cs === 'error',
      'ps-field--disabled': this.isDisabled(),
    };
  });

  readonly resolvedDropzoneText = computed(() =>
    this.dropzoneText() || 'Húzd ide a fotókat, vagy kattints a tallózáshoz'
  );

  readonly resolvedDropzoneHint = computed(() => {
    if (this.dropzoneHint()) return this.dropzoneHint();
    const parts: string[] = [];
    if (this.acceptLabel()) parts.push(this.acceptLabel() + ' fájlok');
    parts.push(`max. ${this.maxSizeMB()} MB / fájl`);
    return parts.join(', ');
  });

  // --- CVA ---
  writeValue(val: File[] | null): void {
    // CVA writeValue - fájlokhoz nem tipikus, de támogatjuk a reset-et
    if (!val || val.length === 0) {
      this.clearAllPreviews();
      this.files.set([]);
    }
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // --- Drag & Drop ---
  onWindowDrag(event: DragEvent): void {
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled()) this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (this.isDisabled()) return;
    const dropped = this.extractFiles(event.dataTransfer);
    if (dropped.length > 0) this.addFiles(dropped);
  }

  // --- File input ---
  onFileInputChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (el.files && el.files.length > 0) {
      this.addFiles(Array.from(el.files));
      el.value = '';
    }
  }

  // --- Lightbox kezeles (document.body-ra appendelve a stacking context miatt) ---
  openLightbox(previewIndex: number): void {
    const file = this.files()[previewIndex];
    if (!file?.previewUrl) return;

    const media = this.lightboxMedia();
    const lbIndex = media.findIndex(m => m.url === file.previewUrl);
    if (lbIndex < 0) return;

    this.destroyLightbox();

    const ref = createComponent(MediaLightboxComponent, {
      environmentInjector: this.envInjector,
    });

    ref.setInput('media', media);
    ref.setInput('currentIndex', lbIndex);
    ref.instance.close.subscribe(() => this.destroyLightbox());
    ref.instance.navigate.subscribe((i: number) => ref.setInput('currentIndex', i));

    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);
    this.lightboxRef = ref;
  }

  private destroyLightbox(): void {
    if (!this.lightboxRef) return;
    this.appRef.detachView(this.lightboxRef.hostView);
    this.lightboxRef.destroy();
    this.lightboxRef = null;
  }

  // --- Fajl kezeles ---
  removeFile(index: number): void {
    const current = this.files();
    const removed = current[index];
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    this.files.set(current.filter((_, i) => i !== index));
    this.emitChange();
  }

  clearAll(): void {
    this.clearAllPreviews();
    this.files.set([]);
    this.emitChange();
  }

  ngOnDestroy(): void {
    this.destroyLightbox();
    this.clearAllPreviews();
  }

  // --- Privat ---
  private addFiles(newFiles: File[]): void {
    const current = this.files();
    const max = this.multiple() ? this.maxFiles() : 1;
    const remaining = max - current.length;

    if (remaining <= 0) {
      this.uploadError.emit(`Maximum ${max} fájl tölthető fel.`);
      return;
    }

    const maxSize = this.maxFileSize();
    const validExtensions = this.accept()
      .split(',')
      .map(ext => ext.trim().replace('.', '').toLowerCase());

    const valid: PsFilePreview[] = [];

    for (const file of newFiles.slice(0, remaining)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && !validExtensions.includes(ext)) {
        this.uploadError.emit(`"${file.name}" nem támogatott formátum.`);
        continue;
      }
      if (file.size > maxSize) {
        this.uploadError.emit(
          `"${file.name}" túl nagy. Maximum ${this.maxSizeMB()} MB engedélyezett.`
        );
        continue;
      }

      const isImage = file.type.startsWith('image/');
      valid.push({
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        name: file.name,
        size: formatFileSize(file.size),
      });
    }

    if (valid.length > 0) {
      if (this.multiple()) {
        this.files.set([...current, ...valid]);
      } else {
        // Single mode: csereld le
        this.clearAllPreviews();
        this.files.set(valid.slice(0, 1));
      }
      this.emitChange();
    }
  }

  private emitChange(): void {
    const rawFiles = this.files().map(p => p.file);
    this.onChange(rawFiles);
    this.onTouched();
  }

  private extractFiles(dt: DataTransfer | null): File[] {
    if (!dt) return [];
    return Array.from(dt.files);
  }

  private clearAllPreviews(): void {
    this.files().forEach(p => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
  }
}

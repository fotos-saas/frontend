import { Directive, input, HostBinding, inject, signal, DestroyRef } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { ElectronService, NativeDragFile } from '../../core/services/electron.service';

/**
 * Native File Drag Directive
 * Enables dragging files from the app to external applications (Finder/Explorer)
 *
 * Usage:
 * <div
 *   [appNativeDrag]="files"
 *   [nativeDragThumbnail]="thumbnailUrl"
 *   [nativeDragEnabled]="true"
 *   (nativeDragStart)="onDragStart()"
 *   (nativeDragEnd)="onDragEnd($event)"
 * >
 *   Drag me
 * </div>
 *
 * Where files is: NativeDragFile[] = [{ url: 'https://...', fileName: 'photo.jpg' }]
 */
@Directive({
  selector: '[appNativeDrag]',
  standalone: true,
  host: {
    '(dragstart)': 'onDragStart($event)',
    '(mousedown)': 'onMouseDown()',
  }
})
export class NativeDragDirective {
  private readonly logger = inject(LoggerService);
  private readonly electronService = inject(ElectronService);
  private readonly destroyRef = inject(DestroyRef);

  /** Files to be dragged (required) */
  readonly appNativeDrag = input.required<NativeDragFile[]>();

  /** Optional thumbnail URL for drag icon */
  readonly nativeDragThumbnail = input<string>();

  /** Enable/disable native drag (default: true) */
  readonly nativeDragEnabled = input<boolean>(true);

  /** Currently preparing files */
  private isPreparing = signal(false);

  /** Prepared file paths (cached) */
  private preparedPaths: string[] = [];

  /** Cleanup flag */
  private cleanupNeeded = false;

  /** Make element draggable */
  @HostBinding('attr.draggable')
  get draggable(): string {
    return this.nativeDragEnabled() && this.electronService.isElectron ? 'true' : 'false';
  }

  /** Cursor style */
  @HostBinding('style.cursor')
  get cursor(): string {
    if (!this.nativeDragEnabled()) return 'default';
    if (this.isPreparing()) return 'progress';
    return this.electronService.isElectron ? 'grab' : 'default';
  }

  /**
   * Handle drag start event
   * Prepares files and initiates native drag
   */
  async onDragStart(event: DragEvent): Promise<void> {
    // Only handle if enabled and in Electron
    if (!this.nativeDragEnabled() || !this.electronService.isElectron) {
      return;
    }

    const files = this.appNativeDrag();
    if (!files || files.length === 0) {
      event.preventDefault();
      return;
    }

    // Prevent default browser drag behavior
    event.preventDefault();

    // Skip if already preparing
    if (this.isPreparing()) {
      return;
    }

    this.isPreparing.set(true);

    try {
      // Prepare files (download to temp)
      const result = await this.electronService.prepareDragFiles(files);

      if (result.success && result.paths.length > 0) {
        this.preparedPaths = result.paths;
        this.cleanupNeeded = true;

        // Start native drag with prepared files
        this.electronService.startNativeDrag(
          result.paths,
          this.nativeDragThumbnail()
        );
      } else {
        this.logger.error('Failed to prepare files for drag', result.error);
      }
    } catch (error) {
      this.logger.error('Error during native drag preparation', error);
    } finally {
      this.isPreparing.set(false);
    }
  }

  /**
   * Handle mouse down - prepare files ahead of time for faster drag
   */
  async onMouseDown(): Promise<void> {
    if (!this.nativeDragEnabled() || !this.electronService.isElectron) {
      return;
    }

    const files = this.appNativeDrag();
    if (!files || files.length === 0 || this.isPreparing()) {
      return;
    }

    // Pre-fetch files on mouse down for faster drag start
    // But don't block the UI
    this.isPreparing.set(true);
    try {
      const result = await this.electronService.prepareDragFiles(files);
      if (result.success) {
        this.preparedPaths = result.paths;
        this.cleanupNeeded = true;
      }
    } catch {
      // Silently fail - will try again on dragstart
    } finally {
      this.isPreparing.set(false);
    }
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.cleanupNeeded && this.preparedPaths.length > 0) {
        this.electronService.cleanupDragFiles(this.preparedPaths).catch(() => {
          // Silently fail - temp cleanup is not critical
        });
      }
    });
  }
}

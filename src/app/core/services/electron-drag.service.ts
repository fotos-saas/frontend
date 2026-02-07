import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { LoggerService } from './logger.service';

type CleanupFn = () => void;

/** Native drag fajl interfesz */
export interface NativeDragFile {
  url: string;
  fileName: string;
  thumbnailUrl?: string;
}

/** Touch Bar elem tipusok */
export type TouchBarItemType = 'button' | 'label' | 'spacer' | 'segmented' | 'slider';

/** Touch Bar elem */
export interface TouchBarItem {
  type: TouchBarItemType;
  id?: string;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  size?: 'small' | 'large' | 'flexible';
  segments?: Array<{ label?: string }>;
  selectedIndex?: number;
  mode?: 'single' | 'multiple' | 'buttons';
  minValue?: number;
  maxValue?: number;
  value?: number;
}

/** Touch Bar kontextusok */
export type TouchBarContext = 'dashboard' | 'gallery' | 'editor';

/**
 * ElectronDragService - Native drag & drop es Touch Bar kezeles
 *
 * Funkcionalitas:
 * - Native file drag & drop (Electron → Finder/Explorer)
 * - Fajl eloelkeszites, drag inditas, cleanup
 * - Touch Bar kontextusok es egyedi elemek (MacBook Pro 2016-2020)
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronDragService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private cleanupFunctions: CleanupFn[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  private get isMac(): boolean {
    return (window.electronAPI?.platform ?? 'browser') === 'darwin';
  }

  // ============ Native File Drag & Drop ============

  /** Fajlok eloelkeszitese drag muveletre (letoltes temp konyvtarba) */
  async prepareDragFiles(files: NativeDragFile[]): Promise<{ success: boolean; paths: string[]; error?: string }> {
    if (!this.isElectron) {
      return { success: false, paths: [], error: 'Native drag only supported in Electron' };
    }
    return window.electronAPI!.nativeDrag.prepareFiles(files);
  }

  /** Native drag inditas eloelkeszitett fajlokkal */
  startNativeDrag(files: string[], thumbnailUrl?: string): void {
    if (!this.isElectron) {
      this.logger.warn('Native drag only supported in Electron');
      return;
    }
    window.electronAPI!.nativeDrag.startDrag(files, thumbnailUrl);
  }

  /** Temp konyvtar lekerdezese drag fajlokhoz */
  async getDragTempDir(): Promise<string | null> {
    if (!this.isElectron) return null;
    return window.electronAPI!.nativeDrag.getTempDir();
  }

  /** Temp fajlok torlese drag muvelet utan */
  async cleanupDragFiles(filePaths: string[]): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.nativeDrag.cleanupFiles(filePaths);
  }

  /** Eloelkeszites + drag inditas egyszerre */
  async prepareAndStartDrag(files: NativeDragFile[], thumbnailUrl?: string): Promise<{ success: boolean; paths: string[]; error?: string }> {
    const result = await this.prepareDragFiles(files);
    if (result.success && result.paths.length > 0) {
      this.startNativeDrag(result.paths, thumbnailUrl);
    }
    return result;
  }

  // ============ Touch Bar (MacBook Pro 2016-2020) ============

  /** Touch Bar elerheto-e */
  get hasTouchBar(): boolean {
    return this.isElectron && this.isMac;
  }

  /** Touch Bar kontextus beallitasa */
  async setTouchBarContext(context: TouchBarContext): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.setContext(context);
  }

  /** Egyedi Touch Bar elemek beallitasa */
  async setTouchBarItems(items: TouchBarItem[]): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.setItems(items);
  }

  /** Touch Bar torlese */
  async clearTouchBar(): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.clear();
  }

  /** Touch Bar akcio callback regisztralas */
  onTouchBarAction(callback: (actionId: string, data?: Record<string, unknown>) => void): void {
    if (!this.hasTouchBar) return;

    const cleanup = window.electronAPI!.touchBar.onAction((actionId, data) => {
      this.ngZone.run(() => {
        this.logger.info('Touch Bar action', actionId, data);
        callback(actionId, data);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }
}

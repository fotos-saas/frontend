import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface ElectronAPI {
  showNotification: (title: string, body: string) => Promise<boolean>;
  getAppInfo: () => Promise<{
    version: string;
    name: string;
    platform: string;
    isDev: boolean;
  }>;
  getDarkMode: () => Promise<boolean>;
  onDarkModeChange: (callback: (isDark: boolean) => void) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private darkMode$ = new BehaviorSubject<boolean>(false);

  constructor(private ngZone: NgZone) {
    this.initDarkModeListener();
  }

  /**
   * Check if running in Electron environment
   */
  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  /**
   * Get current platform (darwin, win32, linux)
   */
  get platform(): string {
    return window.electronAPI?.platform ?? 'browser';
  }

  /**
   * Check if running on macOS
   */
  get isMac(): boolean {
    return this.platform === 'darwin';
  }

  /**
   * Check if running on Windows
   */
  get isWindows(): boolean {
    return this.platform === 'win32';
  }

  /**
   * Observable for dark mode changes
   */
  get darkModeChanges(): Observable<boolean> {
    return this.darkMode$.asObservable();
  }

  /**
   * Show native notification (falls back to browser notification if not Electron)
   */
  async showNotification(title: string, body: string): Promise<boolean> {
    if (this.isElectron) {
      return window.electronAPI!.showNotification(title, body);
    }

    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
      return true;
    }

    return false;
  }

  /**
   * Get app info (version, name, etc.)
   */
  async getAppInfo(): Promise<{ version: string; name: string; platform: string; isDev: boolean } | null> {
    if (this.isElectron) {
      return window.electronAPI!.getAppInfo();
    }
    return null;
  }

  /**
   * Get current dark mode status
   */
  async getDarkMode(): Promise<boolean> {
    if (this.isElectron) {
      return window.electronAPI!.getDarkMode();
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private async initDarkModeListener(): Promise<void> {
    // Get initial value
    const isDark = await this.getDarkMode();
    this.darkMode$.next(isDark);

    if (this.isElectron) {
      // Listen for Electron dark mode changes
      window.electronAPI!.onDarkModeChange((isDark) => {
        this.ngZone.run(() => {
          this.darkMode$.next(isDark);
        });
      });
    } else {
      // Listen for browser dark mode changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.ngZone.run(() => {
          this.darkMode$.next(e.matches);
        });
      });
    }
  }
}

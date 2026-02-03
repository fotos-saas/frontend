import { Injectable, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Device, type DeviceInfo } from '@capacitor/device';

/**
 * Capacitor Service - Mobile platform detection and native features
 *
 * Platform detection, haptic feedback, keyboard handling, network status
 */
@Injectable({ providedIn: 'root' })
export class CapacitorService {
  // Platform detection
  readonly isNative = signal(Capacitor.isNativePlatform());
  readonly platform = signal(Capacitor.getPlatform()); // 'ios' | 'android' | 'web'
  readonly isIOS = computed(() => this.platform() === 'ios');
  readonly isAndroid = computed(() => this.platform() === 'android');

  // Network state
  readonly isOnline = signal(true);
  readonly connectionType = signal<string>('unknown');

  // Device info
  readonly deviceInfo = signal<DeviceInfo | null>(null);

  constructor() {
    if (this.isNative()) {
      this.initializeApp();
    }
  }

  private async initializeApp(): Promise<void> {
    try {
      // Hide splash screen after app is ready
      await SplashScreen.hide();

      // Setup status bar
      await this.setupStatusBar();

      // Setup keyboard
      await this.setupKeyboard();

      // Setup network listener
      await this.setupNetworkListener();

      // Setup deep links
      await this.setupDeepLinks();

      // Get device info
      this.deviceInfo.set(await Device.getInfo());

      // App lifecycle events
      this.setupAppListeners();
    } catch (error) {
      console.error('Capacitor initialization error:', error);
    }
  }

  // ============ Status Bar ============

  private async setupStatusBar(): Promise<void> {
    try {
      if (this.isIOS()) {
        await StatusBar.setStyle({ style: Style.Dark });
      } else {
        await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
        await StatusBar.setStyle({ style: Style.Dark });
      }
    } catch (error) {
      console.error('StatusBar setup error:', error);
    }
  }

  async setStatusBarLight(): Promise<void> {
    if (!this.isNative()) return;
    await StatusBar.setStyle({ style: Style.Light });
  }

  async setStatusBarDark(): Promise<void> {
    if (!this.isNative()) return;
    await StatusBar.setStyle({ style: Style.Dark });
  }

  // ============ Keyboard ============

  private async setupKeyboard(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });

      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
      });
    } catch (error) {
      console.error('Keyboard setup error:', error);
    }
  }

  async hideKeyboard(): Promise<void> {
    if (!this.isNative()) return;
    await Keyboard.hide();
  }

  // ============ Haptics ============

  async hapticLight(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async hapticMedium(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async hapticHeavy(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async hapticSuccess(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.notification({ type: NotificationType.Success });
  }

  async hapticWarning(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.notification({ type: NotificationType.Warning });
  }

  async hapticError(): Promise<void> {
    if (!this.isNative()) return;
    await Haptics.notification({ type: NotificationType.Error });
  }

  // ============ Network ============

  private async setupNetworkListener(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.isOnline.set(status.connected);
      this.connectionType.set(status.connectionType);

      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        this.isOnline.set(status.connected);
        this.connectionType.set(status.connectionType);
      });
    } catch (error) {
      console.error('Network setup error:', error);
    }
  }

  // ============ Deep Links ============

  private async setupDeepLinks(): Promise<void> {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      // Handle deep link: photostack://gallery/123
      const url = new URL(event.url);
      const path = url.pathname;

      // TODO: Navigate to the path
      console.log('Deep link received:', path);
    });
  }

  // ============ App Lifecycle ============

  private setupAppListeners(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App became active');
        // Refresh data, reconnect websockets, etc.
      } else {
        console.log('App went to background');
        // Save state, pause operations, etc.
      }
    });

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  }

  // ============ Utilities ============

  /** Check if specific plugin is available */
  isPluginAvailable(name: string): boolean {
    return Capacitor.isPluginAvailable(name);
  }

  /** Get safe area insets (for notch, etc.) */
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
    };
  }
}

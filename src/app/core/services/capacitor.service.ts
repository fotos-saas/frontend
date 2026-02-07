import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from './logger.service';
import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Device, type DeviceInfo } from '@capacitor/device';
import { Share } from '@capacitor/share';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';

/**
 * Capacitor Service - Mobile platform detection and native features
 *
 * Platform detection, haptic feedback, keyboard handling, network status
 */
@Injectable({ providedIn: 'root' })
export class CapacitorService {
  private readonly logger = inject(LoggerService);
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

  // Push notifications
  readonly pushToken = signal<string | null>(null);

  // Deep link callback
  private deepLinkCallback: ((path: string) => void) | null = null;

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

      // Setup push notifications
      await this.setupPushNotifications();
    } catch (error) {
      this.logger.error('Capacitor initialization error', error);
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
      this.logger.error('StatusBar setup error', error);
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
      this.logger.error('Keyboard setup error', error);
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
      this.logger.error('Network setup error', error);
    }
  }

  // ============ Deep Links ============

  private async setupDeepLinks(): Promise<void> {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      // Handle deep link: photostack://gallery/123 or https://app.tablostudio.hu/path
      try {
        const url = new URL(event.url);
        const path = url.pathname + url.search;

        this.logger.info('Deep link received', path);

        // Call registered callback if exists
        if (this.deepLinkCallback) {
          this.deepLinkCallback(path);
        }
      } catch (error) {
        this.logger.error('Failed to parse deep link', error);
      }
    });
  }

  /**
   * Register a callback for deep links
   * @param callback - Function to call with the path when a deep link is received
   */
  onDeepLink(callback: (path: string) => void): void {
    this.deepLinkCallback = callback;
  }

  // ============ Push Notifications ============

  private async setupPushNotifications(): Promise<void> {
    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
      }

      // Get FCM/APNs token
      PushNotifications.addListener('registration', (token: Token) => {
        this.pushToken.set(token.value);
        this.logger.info('Push token', token.value);
        // TODO: Send to backend
      });

      // Handle registration error
      PushNotifications.addListener('registrationError', (error) => {
        this.logger.error('Push registration error', error);
      });

      // Handle received notification (app in foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        this.logger.info('Push received', notification);
        // Show in-app notification or handle silently
      });

      // Handle notification tap (app opened from notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        this.logger.info('Push action', action);
        // Navigate based on notification data
        const data = action.notification.data;
        if (data?.path && this.deepLinkCallback) {
          this.deepLinkCallback(data.path);
        }
      });
    } catch (error) {
      this.logger.error('Push notifications setup error', error);
    }
  }

  // ============ Share ============

  /**
   * Share content using native share dialog
   */
  async share(options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }): Promise<boolean> {
    if (!this.isNative()) {
      // Fallback for web - copy to clipboard
      if (options.url) {
        await navigator.clipboard.writeText(options.url);
        return true;
      }
      return false;
    }

    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle ?? 'Megosztás',
      });
      return true;
    } catch (error) {
      this.logger.error('Share failed', error);
      return false;
    }
  }

  // ============ App Lifecycle ============

  private setupAppListeners(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.logger.info('App became active');
        // Refresh data, reconnect websockets, etc.
      } else {
        this.logger.info('App went to background');
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

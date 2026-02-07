import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

/**
 * Biometric Service - Face ID / Touch ID / Fingerprint authentication
 *
 * Supports:
 * - iOS: Face ID, Touch ID
 * - Android: Fingerprint, Face, Iris
 *
 * Credentials are stored securely in:
 * - iOS: Keychain
 * - Android: Keystore
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly logger = inject(LoggerService);
  // Availability
  readonly isAvailable = signal(false);
  readonly biometryType = signal<BiometryType>(BiometryType.NONE);

  // Human readable type
  readonly biometryName = computed(() => {
    switch (this.biometryType()) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Ujjlenyomat';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Arcfelismerés';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Írisz azonosítás';
      default:
        return 'Biometrikus azonosítás';
    }
  });

  // Icon based on type
  readonly biometryIcon = computed(() => {
    switch (this.biometryType()) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return 'scan-face';
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return 'fingerprint';
      default:
        return 'shield-check';
    }
  });

  private readonly SERVER_ID = 'hu.tablostudio.app';

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if biometric authentication is available
   */
  async checkAvailability(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      this.isAvailable.set(false);
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      this.isAvailable.set(result.isAvailable);
      this.biometryType.set(result.biometryType);
      return result.isAvailable;
    } catch (error) {
      this.logger.error('Biometric availability check failed', error);
      this.isAvailable.set(false);
      return false;
    }
  }

  /**
   * Authenticate user with biometrics
   * @param reason - Reason shown to user (e.g., "Jelentkezz be a PhotoStack-be")
   */
  async authenticate(reason: string = 'Kérjük, azonosítsd magad'): Promise<boolean> {
    if (!this.isAvailable()) {
      this.logger.warn('Biometric not available');
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Biometrikus azonosítás',
        subtitle: 'PhotoStack',
        description: reason,
        maxAttempts: 3,
        useFallback: true,
        fallbackTitle: 'Jelszó használata',
      });
      return true;
    } catch (error) {
      this.logger.error('Biometric authentication failed', error);
      return false;
    }
  }

  /**
   * Store credentials securely in Keychain/Keystore
   * @param username - User's email or username
   * @param password - User's password or token
   */
  async storeCredentials(username: string, password: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await NativeBiometric.setCredentials({
        username,
        password,
        server: this.SERVER_ID,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to store credentials', error);
      return false;
    }
  }

  /**
   * Retrieve stored credentials after biometric authentication
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_ID,
      });
      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      this.logger.error('Failed to get credentials', error);
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  async deleteCredentials(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await NativeBiometric.deleteCredentials({
        server: this.SERVER_ID,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete credentials', error);
      return false;
    }
  }

  /**
   * Full biometric login flow:
   * 1. Authenticate with biometrics
   * 2. If successful, retrieve stored credentials
   */
  async biometricLogin(): Promise<{ username: string; password: string } | null> {
    // First authenticate
    const authenticated = await this.authenticate('Jelentkezz be a PhotoStack-be');
    if (!authenticated) {
      return null;
    }

    // Then get credentials
    return this.getCredentials();
  }

  /**
   * Check if user has stored credentials for biometric login
   */
  async hasStoredCredentials(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_ID,
      });
      return !!credentials.username;
    } catch {
      return false;
    }
  }
}

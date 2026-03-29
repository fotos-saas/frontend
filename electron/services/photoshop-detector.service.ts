/**
 * PhotoshopDetectorService — Photoshop telepítés keresés és futás-ellenőrzés
 */

import { execFile } from 'child_process';
import * as fs from 'fs';

// ============ Constants ============

export const DEFAULT_PS_PATHS_MAC = [
  '/Applications/Adobe Photoshop 2026/Adobe Photoshop 2026.app',
  '/Applications/Adobe Photoshop 2025/Adobe Photoshop 2025.app',
  '/Applications/Adobe Photoshop 2024/Adobe Photoshop 2024.app',
  '/Applications/Adobe Photoshop CC 2024/Adobe Photoshop CC 2024.app',
];

export const DEFAULT_PS_PATHS_WIN = [
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2026\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop CC 2024\\Photoshop.exe',
];

// ============ Functions ============

export function isValidPhotoshopPath(psPath: string): boolean {
  if (!fs.existsSync(psPath)) return false;
  if (process.platform === 'darwin') {
    return psPath.endsWith('.app') && fs.statSync(psPath).isDirectory();
  }
  return psPath.endsWith('.exe') && fs.statSync(psPath).isFile();
}

export function findPhotoshopInstallation(): string | null {
  const paths = process.platform === 'darwin' ? DEFAULT_PS_PATHS_MAC : DEFAULT_PS_PATHS_WIN;
  for (const psPath of paths) {
    if (isValidPhotoshopPath(psPath)) return psPath;
  }
  return null;
}

export function isPhotoshopRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      resolve(false);
      return;
    }
    execFile('pgrep', ['-x', 'Adobe Photoshop'], (error) => {
      resolve(!error);
    });
  });
}

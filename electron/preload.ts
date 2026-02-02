import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Notifications
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Dark mode
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  onDarkModeChange: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('dark-mode-changed', (_event, isDark) => callback(isDark));
  },

  // Platform detection
  platform: process.platform,
  isElectron: true,
});

// TypeScript type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

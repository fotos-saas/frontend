import { ipcRenderer, IpcRendererEvent } from 'electron';

// Type for cleanup function
type CleanupFn = () => void;

/**
 * Overlay API (always-on-top command palette), Native Drag & Drop, Touch Bar
 */
export function buildOverlayApi() {
  return {
    // ============ Native File Drag & Drop ============
    nativeDrag: {
      /**
       * Prepare files for native drag (downloads remote files to temp)
       * @param files - Array of files with URL and fileName
       * @returns Object with success status and local file paths
       */
      prepareFiles: (files: Array<{ url: string; fileName: string; thumbnailUrl?: string }>) =>
        ipcRenderer.invoke('prepare-drag-files', files) as Promise<{
          success: boolean;
          paths: string[];
          error?: string;
        }>,

      /**
       * Start native drag operation with prepared files
       * @param files - Array of local file paths (from prepareFiles)
       * @param thumbnailUrl - Optional thumbnail URL for drag icon
       */
      startDrag: (files: string[], thumbnailUrl?: string) =>
        ipcRenderer.send('start-drag', { files, thumbnailUrl }),

      /**
       * Get temp directory for drag files
       */
      getTempDir: () =>
        ipcRenderer.invoke('get-drag-temp-dir') as Promise<string>,

      /**
       * Cleanup specific temp files after drag
       * @param filePaths - Array of file paths to clean up
       */
      cleanupFiles: (filePaths: string[]) =>
        ipcRenderer.invoke('cleanup-drag-files', filePaths) as Promise<boolean>,
    },

    // ============ Overlay (Always-on-top Command Palette) ============
    overlay: {
      executeCommand: (commandId: string) =>
        ipcRenderer.invoke('overlay:execute-command', commandId) as Promise<{ success: boolean; error?: string }>,
      getContext: () =>
        ipcRenderer.invoke('overlay:get-context') as Promise<{ mode: 'designer' | 'normal'; projectId?: number }>,
      setContext: (ctx: { mode: 'designer' | 'normal'; projectId?: number }) =>
        ipcRenderer.invoke('overlay:set-context', ctx) as Promise<{ success: boolean; error?: string }>,
      onContextChanged: (callback: (ctx: { mode: 'designer' | 'normal'; projectId?: number }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, ctx: { mode: 'designer' | 'normal'; projectId?: number }) => callback(ctx);
        ipcRenderer.on('overlay:context-changed', handler);
        return () => ipcRenderer.removeListener('overlay:context-changed', handler);
      },
      getProjectId: () =>
        ipcRenderer.invoke('overlay:get-project-id') as Promise<{ projectId: number | null }>,
      hide: () =>
        ipcRenderer.invoke('overlay:hide') as Promise<{ success: boolean }>,
      showMainWindow: () =>
        ipcRenderer.invoke('overlay:show-main-window') as Promise<{ success: boolean }>,
      setIgnoreMouseEvents: (ignore: boolean) =>
        ipcRenderer.send('overlay:set-ignore-mouse', ignore),
      onCommand: (callback: (commandId: string) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, commandId: string) => callback(commandId);
        ipcRenderer.on('overlay-command', handler);
        return () => ipcRenderer.removeListener('overlay-command', handler);
      },
      getActiveDoc: () =>
        ipcRenderer.invoke('overlay:get-active-doc') as Promise<{ name: string | null; path: string | null; dir: string | null }>,
      setActiveDoc: (doc: { name: string | null; path: string | null; dir: string | null }) =>
        ipcRenderer.invoke('overlay:set-active-doc', doc) as Promise<{ success: boolean; error?: string }>,
      onActiveDocChanged: (callback: (doc: { name: string | null; path: string | null; dir: string | null }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, doc: { name: string | null; path: string | null; dir: string | null }) => callback(doc);
        ipcRenderer.on('overlay:active-doc-changed', handler);
        return () => ipcRenderer.removeListener('overlay:active-doc-changed', handler);
      },
      onAuthSynced: (callback: () => void): CleanupFn => {
        const handler = () => callback();
        ipcRenderer.on('overlay:auth-synced', handler);
        return () => ipcRenderer.removeListener('overlay:auth-synced', handler);
      },
      requestAuthSync: () =>
        ipcRenderer.invoke('overlay:request-auth-sync') as Promise<{ success: boolean; keys?: string[] }>,
    },

    // ============ Touch Bar (MacBook Pro 2016-2020) ============
    touchBar: {
      /**
       * Touch Bar kontextus beallitasa (eloredefinalt Touch Bar-ok)
       * @param context - 'dashboard' | 'gallery' | 'editor'
       */
      setContext: (context: string) =>
        ipcRenderer.invoke('set-touch-bar-context', context) as Promise<boolean>,

      /**
       * Egyedi Touch Bar elemek beallitasa
       * @param items - Touch Bar elemek tombje
       */
      setItems: (items: Array<{
        type: 'button' | 'label' | 'spacer' | 'segmented' | 'slider';
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
      }>) =>
        ipcRenderer.invoke('set-touch-bar-items', items) as Promise<boolean>,

      /**
       * Touch Bar eltavolitasa (ures Touch Bar)
       */
      clear: () =>
        ipcRenderer.invoke('clear-touch-bar') as Promise<boolean>,

      /**
       * Touch Bar akcio esemeny figyelese
       * A callback megkapja az actionId-t es opcionalis extra adatokat
       */
      onAction: (callback: (actionId: string, data?: Record<string, unknown>) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, actionId: string, data?: Record<string, unknown>) =>
          callback(actionId, data);
        ipcRenderer.on('touch-bar-action', handler);
        return () => ipcRenderer.removeListener('touch-bar-action', handler);
      },
    },
  };
}

import { ipcRenderer } from 'electron';

/**
 * Image processing APIs: sample generation, finalizer upload,
 * portrait background processing, auto crop / face detection
 */
export function buildProcessingApi() {
  return {
    // ============ Minta generálás ============
    sample: {
      getSettings: () =>
        ipcRenderer.invoke('sample:get-settings') as Promise<{
          success: boolean;
          error?: string;
          settings?: {
            sizeLarge: number;
            sizeSmall: number;
            watermarkText: string;
            watermarkColor: 'white' | 'black';
            watermarkOpacity: number;
            useLargeSize: boolean;
            sampleVersion: string;
          };
        }>,
      setSettings: (settings: Partial<{
        sizeLarge: number;
        sizeSmall: number;
        watermarkText: string;
        watermarkColor: 'white' | 'black';
        watermarkOpacity: number;
        useLargeSize: boolean;
        sampleVersion: string;
      }>) =>
        ipcRenderer.invoke('sample:set-settings', settings) as Promise<{ success: boolean; error?: string }>,
      generate: (params: {
        psdFilePath: string;
        outputDir: string;
        projectId: number;
        projectName: string;
        apiBaseUrl: string;
        authToken: string;
        watermarkText?: string;
        watermarkColor?: 'white' | 'black';
        watermarkOpacity?: number;
        sampleVersion?: string;
        sizes?: Array<{ name: string; width: number }>;
      }) =>
        ipcRenderer.invoke('sample:generate', params) as Promise<{
          success: boolean;
          error?: string;
          localPaths?: string[];
          uploadedCount?: number;
          errors?: string[];
        }>,
    },

    // ============ Véglegesítés ============
    finalizer: {
      upload: (params: {
        flattenedJpgPath: string;
        outputDir: string;
        projectId: number;
        projectName: string;
        apiBaseUrl: string;
        authToken: string;
        type?: 'flat' | 'small_tablo';
        maxSize?: number;
      }) =>
        ipcRenderer.invoke('finalizer:upload', params) as Promise<{
          success: boolean;
          error?: string;
          localPath?: string;
          uploadedCount?: number;
        }>,
    },

    // ============ Portrait háttér feldolgozás ============
    portrait: {
      checkPython: () =>
        ipcRenderer.invoke('portrait:check-python') as Promise<{ available: boolean; error?: string }>,
      processSingle: (params: { inputPath: string; outputPath: string; settings: Record<string, unknown> }) =>
        ipcRenderer.invoke('portrait:process-single', params) as Promise<{
          success: boolean; error?: string; processing_time?: number;
        }>,
      processBatch: (params: { items: Array<{ input: string; output: string }>; settings: Record<string, unknown> }) =>
        ipcRenderer.invoke('portrait:process-batch', params) as Promise<{
          success: boolean; error?: string;
          results?: Array<{ success: boolean; input: string; output?: string; error?: string; processing_time?: number }>;
          total?: number; successful?: number;
        }>,
      downloadBackground: (params: { url: string; outputPath: string }) =>
        ipcRenderer.invoke('portrait:download-background', params) as Promise<{
          success: boolean; error?: string; path?: string;
        }>,
      getTempDir: () =>
        ipcRenderer.invoke('portrait:get-temp-dir') as Promise<string>,
      cleanupTemp: (filePaths: string[]) =>
        ipcRenderer.invoke('portrait:cleanup-temp', filePaths) as Promise<{ success: boolean; cleaned?: number }>,
      readProcessedFile: (params: { filePath: string }) =>
        ipcRenderer.invoke('portrait:read-processed-file', params) as Promise<{
          success: boolean; data?: ArrayBuffer; error?: string;
        }>,
    },

    // ============ Auto Crop (arc detektálás + vágás) ============
    crop: {
      checkPython: () =>
        ipcRenderer.invoke('crop:check-python') as Promise<{ available: boolean; error?: string }>,
      detectFaces: (params: { inputPath: string }) =>
        ipcRenderer.invoke('crop:detect-faces', params) as Promise<{
          success: boolean; error?: string;
          original_width?: number; original_height?: number;
          faces?: Array<Record<string, unknown>>;
          face_count?: number;
          quality?: Record<string, unknown>;
          processing_time?: number;
        }>,
      detectBatch: (params: { items: Array<{ input: string }> }) =>
        ipcRenderer.invoke('crop:detect-batch', params) as Promise<{
          success: boolean; error?: string;
          results?: Array<Record<string, unknown>>;
          total?: number; successful?: number;
        }>,
      executeCrop: (params: {
        inputPath: string; outputPath: string; thumbnailPath?: string;
        face: Record<string, unknown>; settings: Record<string, unknown>;
      }) =>
        ipcRenderer.invoke('crop:execute-crop', params) as Promise<{
          success: boolean; error?: string;
          outputPath?: string; thumbnailPath?: string;
          crop?: { left: number; top: number; width: number; height: number };
        }>,
      executeBatchCrop: (params: {
        items: Array<{
          inputPath: string; outputPath: string; thumbnailPath: string;
          face: Record<string, unknown>;
        }>;
        settings: Record<string, unknown>;
      }) =>
        ipcRenderer.invoke('crop:execute-batch-crop', params) as Promise<{
          success: boolean; error?: string;
          results?: Array<{ success: boolean; inputPath: string; outputPath?: string; thumbnailPath?: string; error?: string }>;
          total?: number; successful?: number;
        }>,
      downloadPhoto: (params: { url: string; outputPath: string }) =>
        ipcRenderer.invoke('crop:download-photo', params) as Promise<{
          success: boolean; error?: string; path?: string;
        }>,
      getTempDir: () =>
        ipcRenderer.invoke('crop:get-temp-dir') as Promise<string>,
      cleanupTemp: (filePaths: string[]) =>
        ipcRenderer.invoke('crop:cleanup-temp', filePaths) as Promise<{ success: boolean; cleaned?: number }>,
      readProcessedFile: (params: { filePath: string }) =>
        ipcRenderer.invoke('crop:read-processed-file', params) as Promise<{
          success: boolean; data?: ArrayBuffer; error?: string;
        }>,
      saveTempFile: (params: { fileName: string; data: ArrayBuffer }) =>
        ipcRenderer.invoke('crop:save-temp-file', params) as Promise<{
          success: boolean; path?: string; error?: string;
        }>,
    },
  };
}

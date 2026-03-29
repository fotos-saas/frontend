import { ipcRenderer, IpcRendererEvent } from 'electron';

// Type for cleanup function
type CleanupFn = () => void;

/**
 * Photoshop integration API: path, launch, PSD generation, JSX execution,
 * layout settings, templates, snapshots, photo placement, drag order
 */
export function buildPhotoshopApi() {
  return {
    photoshop: {
      setPath: (psPath: string) =>
        ipcRenderer.invoke('photoshop:set-path', psPath) as Promise<{ success: boolean; error?: string }>,
      getPath: () =>
        ipcRenderer.invoke('photoshop:get-path') as Promise<string | null>,
      launch: () =>
        ipcRenderer.invoke('photoshop:launch') as Promise<{ success: boolean; error?: string }>,
      checkInstalled: () =>
        ipcRenderer.invoke('photoshop:check-installed') as Promise<{ found: boolean; path: string | null }>,
      browsePath: () =>
        ipcRenderer.invoke('photoshop:browse-path') as Promise<{ cancelled: boolean; path?: string }>,
      generatePsd: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) =>
        ipcRenderer.invoke('photoshop:generate-psd', params) as Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>,
      generatePsdDebug: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) =>
        ipcRenderer.invoke('photoshop:generate-psd-debug', params) as Promise<{ success: boolean; error?: string }>,
      onPsdDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => {
        const handler = (_event: any, data: { line: string; stream: 'stdout' | 'stderr' }) => callback(data);
        ipcRenderer.on('psd-debug-log', handler);
        return () => { ipcRenderer.removeListener('psd-debug-log', handler); };
      },
      getDownloadsPath: () =>
        ipcRenderer.invoke('photoshop:get-downloads-path') as Promise<string>,
      openFile: (filePath: string) =>
        ipcRenderer.invoke('photoshop:open-file', filePath) as Promise<{ success: boolean; error?: string }>,
      getWorkDir: () =>
        ipcRenderer.invoke('photoshop:get-work-dir') as Promise<string | null>,
      setWorkDir: (dirPath: string) =>
        ipcRenderer.invoke('photoshop:set-work-dir', dirPath) as Promise<{ success: boolean; error?: string }>,
      browseWorkDir: () =>
        ipcRenderer.invoke('photoshop:browse-work-dir') as Promise<{ cancelled: boolean; path?: string }>,
      revealInFinder: (filePath: string) =>
        ipcRenderer.invoke('photoshop:reveal-in-finder', filePath) as Promise<{ success: boolean; error?: string }>,
      getMargin: () =>
        ipcRenderer.invoke('photoshop:get-margin') as Promise<number>,
      setMargin: (marginCm: number) =>
        ipcRenderer.invoke('photoshop:set-margin', marginCm) as Promise<{ success: boolean; error?: string }>,
      getStudentSize: () =>
        ipcRenderer.invoke('photoshop:get-student-size') as Promise<number>,
      setStudentSize: (sizeCm: number) =>
        ipcRenderer.invoke('photoshop:set-student-size', sizeCm) as Promise<{ success: boolean; error?: string }>,
      getTeacherSize: () =>
        ipcRenderer.invoke('photoshop:get-teacher-size') as Promise<number>,
      setTeacherSize: (sizeCm: number) =>
        ipcRenderer.invoke('photoshop:set-teacher-size', sizeCm) as Promise<{ success: boolean; error?: string }>,
      getGapH: () =>
        ipcRenderer.invoke('photoshop:get-gap-h') as Promise<number>,
      setGapH: (gapCm: number) =>
        ipcRenderer.invoke('photoshop:set-gap-h', gapCm) as Promise<{ success: boolean; error?: string }>,
      getGapV: () =>
        ipcRenderer.invoke('photoshop:get-gap-v') as Promise<number>,
      setGapV: (gapCm: number) =>
        ipcRenderer.invoke('photoshop:set-gap-v', gapCm) as Promise<{ success: boolean; error?: string }>,
      getNameGap: () =>
        ipcRenderer.invoke('photoshop:get-name-gap') as Promise<number>,
      setNameGap: (gapCm: number) =>
        ipcRenderer.invoke('photoshop:set-name-gap', gapCm) as Promise<{ success: boolean; error?: string }>,
      getNameBreakAfter: () =>
        ipcRenderer.invoke('photoshop:get-name-break-after') as Promise<number>,
      setNameBreakAfter: (breakAfter: number) =>
        ipcRenderer.invoke('photoshop:set-name-break-after', breakAfter) as Promise<{ success: boolean; error?: string }>,
      getTextAlign: () =>
        ipcRenderer.invoke('photoshop:get-text-align') as Promise<string>,
      setTextAlign: (align: string) =>
        ipcRenderer.invoke('photoshop:set-text-align', align) as Promise<{ success: boolean; error?: string }>,
      getGridAlign: () =>
        ipcRenderer.invoke('photoshop:get-grid-align') as Promise<string>,
      setGridAlign: (align: string) =>
        ipcRenderer.invoke('photoshop:set-grid-align', align) as Promise<{ success: boolean; error?: string }>,
      getPositionGap: () =>
        ipcRenderer.invoke('photoshop:get-position-gap') as Promise<number>,
      setPositionGap: (gapCm: number) =>
        ipcRenderer.invoke('photoshop:set-position-gap', gapCm) as Promise<{ success: boolean; error?: string }>,
      getPositionFontSize: () =>
        ipcRenderer.invoke('photoshop:get-position-font-size') as Promise<number>,
      setPositionFontSize: (fontSize: number) =>
        ipcRenderer.invoke('photoshop:set-position-font-size', fontSize) as Promise<{ success: boolean; error?: string }>,
      runJsx: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) =>
        ipcRenderer.invoke('photoshop:run-jsx', params) as Promise<{ success: boolean; error?: string; output?: string }>,
      runJsxDebug: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) =>
        ipcRenderer.invoke('photoshop:run-jsx-debug', params) as Promise<{ success: boolean; error?: string }>,
      onJsxDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => {
        const handler = (_event: any, data: { line: string; stream: 'stdout' | 'stderr' }) => callback(data);
        ipcRenderer.on('jsx-debug-log', handler);
        return () => { ipcRenderer.removeListener('jsx-debug-log', handler); };
      },
      onPlacePhotosProgress: (callback: (data: { current: number; total: number; layerName?: string; done?: boolean }) => void) => {
        const handler = (_event: any, data: { current: number; total: number; layerName?: string; done?: boolean }) => callback(data);
        ipcRenderer.on('place-photos-progress', handler);
        return () => { ipcRenderer.removeListener('place-photos-progress', handler); };
      },
      checkPsdExists: (params: { psdPath: string }) =>
        ipcRenderer.invoke('photoshop:check-psd-exists', params) as Promise<{ success: boolean; exists: boolean; hasLayouts: boolean; hasPlacedPhotos: boolean; placedPhotos: Record<string, number> | null }>,
      findProjectPsd: (params: { folderPath: string }) =>
        ipcRenderer.invoke('photoshop:find-project-psd', params) as Promise<{ success: boolean; exists: boolean; psdPath?: string; hasLayouts?: boolean; hasPlacedPhotos?: boolean; placedPhotos?: Record<string, number> | null }>,
      refreshPlacedJson: (params: { psdFilePath: string; layers: Array<{ layerName: string; photoUrl: string }>; syncBorder?: boolean }) =>
        ipcRenderer.invoke('photoshop:refresh-placed-json', params) as Promise<{ success: boolean; count?: number; error?: string }>,
      writeProjectInfo: (params: { psdFilePath: string; projectId: number; projectName?: string; schoolName?: string; className?: string }) =>
        ipcRenderer.invoke('photoshop:write-project-info', params) as Promise<{ success: boolean; error?: string }>,
      backupPsd: (params: { psdPath: string }) =>
        ipcRenderer.invoke('photoshop:backup-psd', params) as Promise<{ success: boolean; error?: string; backupPath?: string }>,
      saveLayoutJson: (params: { psdPath: string; layoutData: Record<string, unknown> }) =>
        ipcRenderer.invoke('photoshop:save-layout-json', params) as Promise<{ success: boolean; error?: string; jsonPath?: string }>,
      saveSnapshot: (params: { psdPath: string; snapshotData: Record<string, unknown>; fileName: string }) =>
        ipcRenderer.invoke('photoshop:save-snapshot', params) as Promise<{ success: boolean; error?: string; snapshotPath?: string }>,
      listSnapshots: (params: { psdPath: string }) =>
        ipcRenderer.invoke('photoshop:list-snapshots', params) as Promise<{ success: boolean; error?: string; snapshots: Array<{ fileName: string; filePath: string; snapshotName: string; createdAt: string | null; personCount: number }> }>,
      loadSnapshot: (params: { snapshotPath: string }) =>
        ipcRenderer.invoke('photoshop:load-snapshot', params) as Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }>,
      deleteSnapshot: (params: { snapshotPath: string }) =>
        ipcRenderer.invoke('photoshop:delete-snapshot', params) as Promise<{ success: boolean; error?: string }>,
      renameSnapshot: (params: { snapshotPath: string; newName: string }) =>
        ipcRenderer.invoke('photoshop:rename-snapshot', params) as Promise<{ success: boolean; error?: string }>,
      saveTemplate: (params: { templateData: any }) =>
        ipcRenderer.invoke('photoshop:save-template', params) as Promise<{ success: boolean; error?: string }>,
      listTemplates: () =>
        ipcRenderer.invoke('photoshop:list-templates') as Promise<{ success: boolean; error?: string; templates: any[] }>,
      loadTemplate: (params: { templateId: string }) =>
        ipcRenderer.invoke('photoshop:load-template', params) as Promise<{ success: boolean; error?: string; data?: any }>,
      deleteTemplate: (params: { templateId: string }) =>
        ipcRenderer.invoke('photoshop:delete-template', params) as Promise<{ success: boolean; error?: string }>,
      renameTemplate: (params: { templateId: string; newName: string }) =>
        ipcRenderer.invoke('photoshop:rename-template', params) as Promise<{ success: boolean; error?: string }>,
      applyTemplate: (params: { templateId: string; targetDocName?: string; psdFilePath?: string }) =>
        ipcRenderer.invoke('photoshop:apply-template', params) as Promise<{ success: boolean; error?: string; output?: string }>,
      placePhotos: (params: { layers: Array<{ layerName: string; photoUrl: string }>; targetDocName?: string; psdFilePath?: string; syncBorder?: boolean }) =>
        ipcRenderer.invoke('photoshop:place-photos', params) as Promise<{ success: boolean; error?: string; output?: string }>,
      saveTempFiles: (params: { files: Array<{ name: string; data: ArrayBuffer }> }) =>
        ipcRenderer.invoke('photoshop:save-temp-files', params) as Promise<{ success: boolean; paths: string[]; error?: string }>,
      saveDragOrder: (params: { psdPath: string; dragOrderData: Record<string, unknown> }) =>
        ipcRenderer.invoke('photoshop:save-drag-order', params) as Promise<{ success: boolean; error?: string; jsonPath?: string }>,
      loadDragOrder: (params: { psdPath: string }) =>
        ipcRenderer.invoke('photoshop:load-drag-order', params) as Promise<{ success: boolean; error?: string; data: Record<string, unknown> | null }>,
    },

    // PSD cache — workDir figyelés chokidarral
    psdCache: {
      getAll: () =>
        ipcRenderer.invoke('psd-cache:get-all') as Promise<Array<{
          folderPath: string;
          psdPath: string;
          psdLastModified: string;
          placedPhotos: Record<string, number> | null;
          placedPhotosLastModified: string | null;
        }>>,
      rescan: () =>
        ipcRenderer.invoke('psd-cache:rescan') as Promise<Array<{
          folderPath: string;
          psdPath: string;
          psdLastModified: string;
          placedPhotos: Record<string, number> | null;
          placedPhotosLastModified: string | null;
        }>>,
      getStatus: () =>
        ipcRenderer.invoke('psd-cache:get-status') as Promise<{ watching: boolean; entryCount: number; workDir: string | null }>,
      onUpdated: (callback: (data: { folderPath: string; entry: {
        folderPath: string; psdPath: string; psdLastModified: string;
        placedPhotos: Record<string, number> | null; placedPhotosLastModified: string | null;
      } }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, data: any) => callback(data);
        ipcRenderer.on('psd-cache:updated', handler);
        return () => ipcRenderer.removeListener('psd-cache:updated', handler);
      },
      onRemoved: (callback: (data: { folderPath: string }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, data: { folderPath: string }) => callback(data);
        ipcRenderer.on('psd-cache:removed', handler);
        return () => ipcRenderer.removeListener('psd-cache:removed', handler);
      },
    },
  };
}

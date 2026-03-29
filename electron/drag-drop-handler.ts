import { app, ipcMain, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import log from 'electron-log/main';
import { isAllowedOrigin } from './constants';

// ============ Native File Drag & Drop ============

interface DragFile {
  url: string;
  fileName: string;
  thumbnailUrl?: string;
}

/**
 * Temporary directory for downloaded files during drag operations
 */
function getTempDragDir(): string {
  const tempDir = path.join(app.getPath('temp'), 'photostack-drag');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Clean up old temp files (older than 1 hour)
 */
function cleanupTempDragDir(): void {
  try {
    const tempDir = getTempDragDir();
    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > ONE_HOUR) {
        fs.unlinkSync(filePath);
        log.info(`Cleaned up old temp file: ${file}`);
      }
    }
  } catch (error) {
    log.error('Failed to cleanup temp drag dir:', error);
  }
}

/**
 * Download a file from URL to temp directory
 * Returns the local file path
 */
async function downloadFileForDrag(url: string, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = getTempDragDir();
    const localPath = path.join(tempDir, fileName);

    // If file already exists and is recent, use it
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - stats.mtimeMs < FIVE_MINUTES) {
        log.info(`Using cached file: ${fileName}`);
        resolve(localPath);
        return;
      }
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(localPath);

    log.info(`Downloading file for drag: ${url}`);

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFileForDrag(redirectUrl, fileName)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        log.info(`Downloaded file: ${fileName}`);
        resolve(localPath);
      });
    }).on('error', (err) => {
      fs.unlink(localPath, () => {}); // Delete incomplete file
      reject(err);
    });
  });
}

/**
 * Create a drag icon from an image URL or use default
 */
async function createDragIcon(imageUrl?: string): Promise<Electron.NativeImage> {
  // Try to create icon from provided image URL
  if (imageUrl) {
    try {
      const response = await new Promise<Buffer>((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;
        protocol.get(imageUrl, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });

      const image = nativeImage.createFromBuffer(response);
      // Resize to appropriate drag icon size (64x64 for macOS, 32x32 for Windows)
      const size = process.platform === 'darwin' ? 64 : 32;
      return image.resize({ width: size, height: size });
    } catch (error) {
      log.warn('Failed to create drag icon from URL, using default:', error);
    }
  }

  // Use default drag icon from assets
  const iconPath = path.join(__dirname, '..', 'assets', 'drag-icon.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // Fallback: use app icon
  const appIconPath = path.join(__dirname, '..', 'assets', 'icons', '64x64.png');
  if (fs.existsSync(appIconPath)) {
    return nativeImage.createFromPath(appIconPath);
  }

  // Last resort: create a simple colored square
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABSSURBVFiF7c6xDQAgDAOwJv9/mW4gCyk6S8h4AAAAAACAfwqWgqXgXHASLAUALgVLQZ0CS0GdAlZQp4AV1ClgBXUKWEGdAtZHwVKwFNQpAAB81wKXlA4zpVXqEgAAAABJRU5ErkJggg=='
  );
}

/**
 * Register all drag & drop IPC handlers
 */
export function registerDragDropHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Schedule cleanup every hour
  setInterval(cleanupTempDragDir, 60 * 60 * 1000);

  /**
   * IPC Handler: Prepare files for native drag
   * Downloads remote files to temp directory and returns local paths
   */
  ipcMain.handle('prepare-drag-files', async (_event, files: DragFile[]): Promise<{ success: boolean; paths: string[]; error?: string }> => {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return { success: false, paths: [], error: 'No files provided' };
      }

      // Limit to prevent abuse
      if (files.length > 50) {
        return { success: false, paths: [], error: 'Maximum 50 files allowed' };
      }

      // Validate URLs are from allowed domains
      for (const file of files) {
        if (!isAllowedOrigin(file.url) && !file.url.startsWith('https://api.tablostudio.hu')) {
          return { success: false, paths: [], error: `Invalid file URL: ${file.url}` };
        }
      }

      // Download files in parallel (with concurrency limit)
      const CONCURRENCY = 5;
      const paths: string[] = [];

      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY);
        const batchPaths = await Promise.all(
          batch.map(file => downloadFileForDrag(file.url, file.fileName))
        );
        paths.push(...batchPaths);
      }

      return { success: true, paths };
    } catch (error) {
      log.error('Failed to prepare drag files:', error);
      return { success: false, paths: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * IPC Handler: Start native drag operation
   * Uses webContents.startDrag for native OS drag
   */
  ipcMain.on('start-drag', async (event, { files, thumbnailUrl }: { files: string[]; thumbnailUrl?: string }) => {
    try {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        log.error('No main window for drag operation');
        return;
      }

      if (!Array.isArray(files) || files.length === 0) {
        log.error('No files provided for drag');
        return;
      }

      // Verify all files exist
      const validFiles = files.filter(filePath => {
        if (!fs.existsSync(filePath)) {
          log.warn(`File does not exist: ${filePath}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        log.error('No valid files for drag');
        return;
      }

      // Create drag icon
      const icon = await createDragIcon(thumbnailUrl);

      // Start native drag
      // Note: Electron's startDrag only supports single file on some platforms
      // For multiple files, we use the first file but indicate count
      if (validFiles.length === 1) {
        mainWindow.webContents.startDrag({
          file: validFiles[0],
          icon: icon,
        });
      } else {
        // For multiple files on macOS, we can pass an array
        // On Windows, we need to handle this differently
        if (process.platform === 'darwin') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mainWindow.webContents.startDrag as any)({
            files: validFiles,
            icon: icon,
          });
        } else {
          // Windows: Create a zip or use first file with indicator
          // For now, we'll just use the first file
          mainWindow.webContents.startDrag({
            file: validFiles[0],
            icon: icon,
          });
          log.info(`Started drag with ${validFiles.length} files (Windows: first file only)`);
        }
      }

      log.info(`Started native drag with ${validFiles.length} file(s)`);
    } catch (error) {
      log.error('Failed to start drag:', error);
    }
  });

  /**
   * IPC Handler: Get temp directory for drag files
   */
  ipcMain.handle('get-drag-temp-dir', () => {
    return getTempDragDir();
  });

  /**
   * IPC Handler: Cleanup specific temp files
   */
  ipcMain.handle('cleanup-drag-files', async (_event, filePaths: string[]) => {
    try {
      const tempDir = getTempDragDir();

      for (const filePath of filePaths) {
        // Security: only delete files within temp directory
        if (filePath.startsWith(tempDir) && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log.info(`Cleaned up drag file: ${path.basename(filePath)}`);
        }
      }

      return true;
    } catch (error) {
      log.error('Failed to cleanup drag files:', error);
      return false;
    }
  });
}

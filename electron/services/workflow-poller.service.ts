/**
 * WorkflowPollerService — Electron background workflow feldolgozó
 *
 * - 30 mp polling: GET /partner/desktop/workflow-tasks
 * - Step végrehajtás a JsxRunnerService-szel
 * - Eredmény: POST /partner/desktop/workflow-tasks/{stepId}/result
 * - Exponenciális backoff hiba esetén (30s → 60s → 120s → max 300s)
 * - Photoshop ellenőrzés + automatikus indítás
 */

import * as https from 'https';
import * as http from 'http';
import * as keytar from 'keytar';
import log from 'electron-log/main';
import { JsxRunnerService } from './jsx-runner.service';
import { TrayManagerService } from './tray-manager.service';

const KEYCHAIN_SERVICE = 'hu.tablostudio.app';
const KEYCHAIN_DAEMON_KEY = '__daemon_token__';
const BASE_POLL_INTERVAL = 30_000;
const MAX_POLL_INTERVAL = 300_000;
// Production default — lokálisan felülírható a daemon tokennel együtt
const DEFAULT_API_BASE = 'https://api.tablostudio.hu';

interface WorkflowTask {
  step_id: number;
  workflow_id: number;
  step_key: string;
  executor: string;
  input_data: Record<string, unknown>;
}

interface TasksResponse {
  task: WorkflowTask | null;
  pending_approval_count: number;
}

export class WorkflowPollerService {
  private pollInterval = BASE_POLL_INTERVAL;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private isPaused = false;
  private isProcessing = false;
  private token: string | null = null;
  private apiBase = DEFAULT_API_BASE;

  constructor(
    private readonly jsxRunner: JsxRunnerService,
    private readonly trayManager: TrayManagerService,
  ) {}

  async start(): Promise<void> {
    log.info('WorkflowPoller indul...');

    this.token = await this.loadToken();
    if (!this.token) {
      log.warn('WorkflowPoller: nincs daemon token, polling nem indul');
      this.trayManager.showNotification(
        'PhotoStack Előkészítő',
        'Kérjük, jelentkezzen be az alkalmazásban a háttérszolgáltatás aktiválásához.',
      );
      return;
    }

    this.trayManager.create({
      onPauseToggle: () => this.togglePause(),
    });

    this.schedulePoll();
    log.info('WorkflowPoller elindult');
  }

  stop(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.trayManager.destroy();
    log.info('WorkflowPoller leallitva');
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.trayManager.setPaused(this.isPaused);

    if (!this.isPaused) {
      this.pollInterval = BASE_POLL_INTERVAL;
      this.schedulePoll();
    }
  }

  private schedulePoll(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.isPaused) return;

    this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
  }

  private async poll(): Promise<void> {
    if (this.isPaused || this.isProcessing) {
      this.schedulePoll();
      return;
    }

    try {
      const response = await this.apiGet<TasksResponse>('/partner/desktop/workflow-tasks');

      this.trayManager.setPendingCount(response.pending_approval_count ?? 0);
      this.pollInterval = BASE_POLL_INTERVAL;

      if (response.task) {
        await this.processTask(response.task);
        // Gyors follow-up: ha volt feladat, hamarabb kérdezzünk újra
        this.pollInterval = 5_000;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      log.error('WorkflowPoller polling hiba:', errMsg);

      if (errMsg.includes('401')) {
        log.warn('WorkflowPoller: token lejart, megprobal frissiteni');
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.trayManager.showNotification(
            'PhotoStack Előkészítő',
            'A bejelentkezés lejárt. Kérjük, jelentkezzen be újra.',
          );
          this.stop();
          return;
        }
      }

      this.pollInterval = Math.min(this.pollInterval * 2, MAX_POLL_INTERVAL);
      log.info(`WorkflowPoller backoff: ${this.pollInterval / 1000}s`);
    }

    this.schedulePoll();
  }

  private async processTask(task: WorkflowTask): Promise<void> {
    this.isProcessing = true;

    try {
      log.info(`Workflow step feldolgozas: ${task.step_key} (step #${task.step_id})`);

      const result = await this.executeStep(task);

      await this.apiPost(`/partner/desktop/workflow-tasks/${task.step_id}/result`, {
        success: result.success,
        output_data: result.outputData ?? {},
        error_message: result.error ?? null,
      });

      log.info(`Workflow step kesz: ${task.step_key} — ${result.success ? 'siker' : 'hiba'}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      log.error(`Workflow step hiba (${task.step_key}):`, errMsg);

      await this.apiPost(`/partner/desktop/workflow-tasks/${task.step_id}/result`, {
        success: false,
        output_data: {},
        error_message: errMsg,
      }).catch(e => log.error('Eredmeny kuldes sikertelen:', e));
    }

    this.isProcessing = false;
  }

  private async executeStep(task: WorkflowTask): Promise<{ success: boolean; outputData?: Record<string, unknown>; error?: string }> {
    const psRunning = await this.jsxRunner.isPhotoshopRunning();
    if (!psRunning) {
      return { success: false, error: 'Photoshop nem fut. Kérjük, indítsa el a Photoshop-ot.' };
    }

    switch (task.step_key) {
      case 'backup_psd':
        return this.executeBackupPsd(task);
      case 'place_photos':
        return this.executePlacePhotos(task);
      case 'generate_sample':
        return this.executeGenerateSample(task);
      default:
        return { success: false, error: `Ismeretlen step: ${task.step_key}` };
    }
  }

  private async executeBackupPsd(task: WorkflowTask): Promise<{ success: boolean; outputData?: Record<string, unknown>; error?: string }> {
    const input = task.input_data as { psd_file_path?: string; target_doc_name?: string };
    const result = await this.jsxRunner.runJsx({
      scriptName: 'actions/save-and-close.jsx',
      psdFilePath: input.psd_file_path,
      targetDocName: input.target_doc_name,
    });

    return {
      success: result.success,
      outputData: result.output ? { jsx_output: result.output } : {},
      error: result.error,
    };
  }

  private async executePlacePhotos(task: WorkflowTask): Promise<{ success: boolean; outputData?: Record<string, unknown>; error?: string }> {
    const input = task.input_data as {
      layers?: Array<{ layerName: string; photoUrl: string }>;
      target_doc_name?: string;
      psd_file_path?: string;
      sync_border?: boolean;
    };

    if (!input.layers || input.layers.length === 0) {
      return { success: false, error: 'Nincs layer adat' };
    }

    // A fotó letöltés és JSX futtatás a JsxRunnerService-n keresztül
    const downloadResults = await Promise.all(
      input.layers.map(async (item) => {
        try {
          const ext = item.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${item.layerName}.${ext}`;
          const localPath = await this.jsxRunner.downloadPhoto(item.photoUrl, fileName);
          return { layerName: item.layerName, photoPath: localPath };
        } catch {
          return null;
        }
      }),
    );

    const validLayers = downloadResults.filter((r): r is { layerName: string; photoPath: string } => r !== null);
    if (validLayers.length === 0) {
      return { success: false, error: 'Egy foto sem sikerult letolteni' };
    }

    const result = await this.jsxRunner.runJsx({
      scriptName: 'actions/place-photos.jsx',
      jsonData: { layers: validLayers as unknown as Record<string, unknown> },
      psdFilePath: input.psd_file_path,
      targetDocName: input.target_doc_name,
    });

    return {
      success: result.success,
      outputData: { placed_count: validLayers.length, jsx_output: result.output ?? '' },
      error: result.error,
    };
  }

  private async executeGenerateSample(task: WorkflowTask): Promise<{ success: boolean; outputData?: Record<string, unknown>; error?: string }> {
    const input = task.input_data as { psd_file_path?: string; target_doc_name?: string };

    const result = await this.jsxRunner.runJsx({
      scriptName: 'actions/flatten-export.jsx',
      psdFilePath: input.psd_file_path,
      targetDocName: input.target_doc_name,
    });

    return {
      success: result.success,
      outputData: result.output ? { jsx_output: result.output } : {},
      error: result.error,
    };
  }

  // ---- Auth ----

  private async loadToken(): Promise<string | null> {
    try {
      return await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_DAEMON_KEY);
    } catch {
      log.warn('WorkflowPoller: keychain olvasas sikertelen');
      return null;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await this.apiPost<{ token: string }>('/partner/auth/refresh-daemon-token', {});
      if (response?.token) {
        this.token = response.token;
        await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_DAEMON_KEY, response.token);
        log.info('WorkflowPoller: token frissitve');
        return true;
      }
    } catch (error) {
      log.error('WorkflowPoller: token frissites sikertelen:', error);
    }
    return false;
  }

  // ---- HTTP helpers ----

  private apiGet<T>(endpoint: string): Promise<T> {
    return this.apiRequest<T>('GET', endpoint);
  }

  private apiPost<T>(endpoint: string, body: unknown): Promise<T> {
    return this.apiRequest<T>('POST', endpoint, body);
  }

  private apiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiBase);
      const isHttps = url.protocol === 'https:';
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Client': 'photostack-daemon',
        },
      };

      const protocol = isHttps ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              resolve({} as T);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30_000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}

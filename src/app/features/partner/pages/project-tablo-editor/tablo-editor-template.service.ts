import { Injectable, inject, signal } from '@angular/core';
import { TemplateListItem } from '@core/services/electron.types';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../../services/photoshop.service';

/**
 * TabloEditorTemplateService — Globalis sablon rendszer UI state + logika
 *
 * Komponens-szintu service (providers: [...] a komponensben).
 * Kezeli a sablon CRUD muveleteket es a dialog allapotokat.
 */
@Injectable()
export class TabloEditorTemplateService {
  private readonly ps = inject(PhotoshopService);
  private readonly logger = inject(LoggerService);

  /** Sablon lista */
  readonly templates = signal<TemplateListItem[]>([]);
  readonly loadingTemplates = signal(false);

  /** Mentes dialog */
  readonly showSaveDialog = signal(false);
  readonly templateName = signal('');
  readonly savingTemplate = signal(false);

  /** Alkalmazas dialog */
  readonly showApplyDialog = signal(false);
  readonly applyingTemplate = signal(false);

  /** Inline atnevezes */
  readonly editingTemplateId = signal<string | null>(null);
  readonly editingName = signal('');
  private originalEditingName = '';

  /** Sablon lista betoltese */
  async loadTemplates(): Promise<void> {
    this.loadingTemplates.set(true);
    try {
      const list = await this.ps.listTemplates();
      this.templates.set(list);
    } finally {
      this.loadingTemplates.set(false);
    }
  }

  /** Sablon mentese dialog megnyitasa */
  openSaveDialog(): void {
    this.templateName.set('');
    this.showSaveDialog.set(true);
  }

  /** Mentes dialog bezarasa */
  closeSaveDialog(): void {
    this.showSaveDialog.set(false);
    this.templateName.set('');
  }

  /** Sablon mentese */
  async saveTemplate(
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const name = this.templateName().trim();
    if (!name) {
      return { success: false, error: 'Add meg a sablon nevét!' };
    }

    this.savingTemplate.set(true);
    try {
      const result = await this.ps.saveTemplate(name, boardConfig, targetDocName);
      if (result.success) {
        this.closeSaveDialog();
        await this.loadTemplates();
      }
      return result;
    } finally {
      this.savingTemplate.set(false);
    }
  }

  /** Alkalmazas dialog megnyitasa */
  openApplyDialog(): void {
    this.showApplyDialog.set(true);
    this.loadTemplates();
  }

  /** Alkalmazas dialog bezarasa */
  closeApplyDialog(): void {
    this.showApplyDialog.set(false);
  }

  /** Sablon alkalmazasa */
  async applyTemplate(
    templateId: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.applyingTemplate.set(true);
    try {
      const result = await this.ps.applyTemplate(templateId, targetDocName);
      if (result.success) {
        this.closeApplyDialog();
      }
      return result;
    } finally {
      this.applyingTemplate.set(false);
    }
  }

  /** Sablon torlese */
  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.ps.deleteTemplate(templateId);
      if (result.success) {
        await this.loadTemplates();
      }
      return result;
    } catch (err) {
      this.logger.error('Sablon torles hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon törlésnél' };
    }
  }

  /** Inline szerkesztes inditasa */
  startEditing(template: TemplateListItem): void {
    this.editingTemplateId.set(template.id);
    this.editingName.set(template.templateName);
    this.originalEditingName = template.templateName;
  }

  /** Inline szerkesztes mentese */
  async commitEditing(): Promise<{ success: boolean; error?: string }> {
    const templateId = this.editingTemplateId();
    const newName = this.editingName().trim();

    if (!templateId) return { success: true };

    if (!newName || newName === this.originalEditingName) {
      this.cancelEditing();
      return { success: true };
    }

    try {
      const result = await this.ps.renameTemplate(templateId, newName);
      if (result.success) {
        await this.loadTemplates();
      }
      return result;
    } finally {
      this.cancelEditing();
    }
  }

  /** Inline szerkesztes megszakitasa */
  cancelEditing(): void {
    this.editingTemplateId.set(null);
    this.editingName.set('');
    this.originalEditingName = '';
  }

  /** Datum formazas */
  formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}

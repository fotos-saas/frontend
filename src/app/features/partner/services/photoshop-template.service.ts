import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotLayer, TemplateSlot, TemplateFixedLayer, TemplateListItem, GlobalTemplate } from '@core/services/electron.types';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';

/**
 * PhotoshopTemplateService — Template CRUD + slot extraction.
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopTemplateService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);
  private readonly jsxService = inject(PhotoshopJsxService);

  private get api() { return this.pathService.api; }

  /** Slot extraction: layers[] → studentSlots, teacherSlots, fixedLayers */
  private extractSlotsFromLayers(layers: SnapshotLayer[]): {
    studentSlots: TemplateSlot[]; teacherSlots: TemplateSlot[]; fixedLayers: TemplateFixedLayer[];
  } {
    const studentImages: SnapshotLayer[] = [];
    const teacherImages: SnapshotLayer[] = [];
    const studentNames: SnapshotLayer[] = [];
    const teacherNames: SnapshotLayer[] = [];
    const fixedLayers: TemplateFixedLayer[] = [];

    for (const l of layers) {
      const gp = l.groupPath;
      if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Students') studentImages.push(l);
      else if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Teachers') teacherImages.push(l);
      else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Students') studentNames.push(l);
      else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Teachers') teacherNames.push(l);
      else fixedLayers.push({ layerName: l.layerName, groupPath: l.groupPath, x: l.x, y: l.y, width: l.width, height: l.height, kind: l.kind });
    }

    const buildSlots = (images: SnapshotLayer[], names: SnapshotLayer[]): TemplateSlot[] => {
      const nameMap = new Map<string, SnapshotLayer>();
      for (const n of names) nameMap.set(n.layerName, n);
      return images.map((img, index) => {
        const nameLayer = nameMap.get(img.layerName);
        return {
          index,
          image: { x: img.x, y: img.y, width: img.width, height: img.height },
          name: nameLayer ? {
            x: nameLayer.x, y: nameLayer.y, width: nameLayer.width, height: nameLayer.height,
            justification: (nameLayer.justification || 'center') as 'left' | 'center' | 'right',
          } : null,
        };
      });
    };

    return { studentSlots: buildSlots(studentImages, studentNames), teacherSlots: buildSlots(teacherImages, teacherNames), fixedLayers };
  }

  /** Sablon mentése */
  async saveTemplate(
    name: string,
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const layoutResult = await this.jsxService.readFullLayout(boardConfig, targetDocName);
    if (!layoutResult.success || !layoutResult.data) {
      return { success: false, error: layoutResult.error || 'Layout kiolvasás sikertelen' };
    }

    const { studentSlots, teacherSlots, fixedLayers } = this.extractSlotsFromLayers(layoutResult.data.layers);

    const template: GlobalTemplate = {
      version: 1, type: 'template', id: `tmpl-${Date.now()}`,
      templateName: name.trim(), createdAt: new Date().toISOString(),
      source: {
        documentName: layoutResult.data.document.name,
        widthPx: layoutResult.data.document.widthPx,
        heightPx: layoutResult.data.document.heightPx,
        dpi: layoutResult.data.document.dpi,
      },
      board: layoutResult.data.board as GlobalTemplate['board'],
      nameSettings: layoutResult.data.nameSettings as GlobalTemplate['nameSettings'],
      studentSlots, teacherSlots, fixedLayers,
    };

    try {
      const result = await this.api.saveTemplate({ templateData: template });
      if (!result.success) return { success: false, error: result.error || 'Sablon mentés sikertelen' };
      this.logger.info(`Sablon mentve: ${name} (${studentSlots.length} diák + ${teacherSlots.length} tanár slot)`);
      return { success: true };
    } catch (err) {
      this.logger.error('Sablon mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon mentésnél' };
    }
  }

  /** Sablon lista lekérés */
  async listTemplates(): Promise<TemplateListItem[]> {
    if (!this.api) return [];
    try {
      const result = await this.api.listTemplates();
      return result.success ? result.templates : [];
    } catch (err) {
      this.logger.error('Sablon lista hiba', err);
      return [];
    }
  }

  /** Sablon betöltése */
  async loadTemplate(templateId: string): Promise<{ success: boolean; error?: string; data?: GlobalTemplate }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.loadTemplate({ templateId });
    } catch (err) {
      this.logger.error('Sablon betöltés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon betöltésnél' };
    }
  }

  /** Sablon törlése */
  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.deleteTemplate({ templateId });
    } catch (err) {
      this.logger.error('Sablon törlés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon törlésnél' };
    }
  }

  /** Sablon átnevezése */
  async renameTemplate(templateId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.renameTemplate({ templateId, newName });
    } catch (err) {
      this.logger.error('Sablon átnevezés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon átnevezésnél' };
    }
  }

  /** Sablon alkalmazása */
  async applyTemplate(templateId: string, targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.api.applyTemplate({ templateId, targetDocName, psdFilePath: this.pathService.psdPath() ?? undefined });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('Sablon alkalmazás hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon alkalmazásnál' };
    }
  }
}

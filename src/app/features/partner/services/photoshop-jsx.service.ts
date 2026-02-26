import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotLayer } from '@core/services/electron.types';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { TabloLayoutConfig } from '../pages/project-tablo-editor/layout-designer/layout-designer.types';

/**
 * PhotoshopJsxService — JSX layer műveletek (guides, subtitles, names, images, grid, arrange, link/unlink, resize).
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopJsxService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);
  private readonly settings = inject(PhotoshopSettingsService);
  private readonly psdService = inject(PhotoshopPsdService);

  private get api() { return this.pathService.api; }
  private runJsx(params: Parameters<PhotoshopPathService['runJsx']>[0]) { return this.pathService.runJsx(params); }

  /** Guide-ok hozzáadása (margó cm alapján) */
  async addGuides(targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    const marginCm = this.settings.marginCm();
    if (marginCm <= 0) return { success: true };
    try {
      const result = await this.runJsx({ scriptName: 'actions/add-guides.jsx', jsonData: { marginCm }, targetDocName });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addGuides hiba', err);
      return { success: false, error: 'Váratlan hiba a guide-ok hozzáadásakor' };
    }
  }

  /** Subtitle felirat tömb összeállítása projekt adatokból */
  buildSubtitles(context: {
    schoolName?: string | null;
    className?: string | null;
    classYear?: string | null;
  }): Array<{ name: string; text: string; fontSize?: number }> {
    const subtitles: Array<{ name: string; text: string; fontSize?: number }> = [];
    if (context.schoolName) subtitles.push({ name: 'iskola-neve', text: context.schoolName, fontSize: 80 });
    if (context.className) subtitles.push({ name: 'osztaly', text: context.className, fontSize: 70 });
    const year = context.classYear || new Date().getFullYear().toString();
    subtitles.push({ name: 'evfolyam', text: year, fontSize: 70 });
    subtitles.push({ name: 'idezet', text: '„Nem az a fontos, amit adnak, hanem amit adunk."', fontSize: 50 });
    return subtitles;
  }

  /** Felirat text layerek hozzáadása */
  async addSubtitleLayers(
    subtitles: Array<{ name: string; text: string; fontSize?: number }>,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!subtitles || subtitles.length === 0) return { success: true };
    try {
      const result = await this.runJsx({
        scriptName: 'actions/add-subtitle-layers.jsx',
        jsonData: { subtitles: subtitles.map(s => ({ layerName: s.name, displayText: s.text, fontSize: s.fontSize || 50 })) },
        targetDocName,
      });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addSubtitleLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a felirat layerek hozzáadásakor' };
    }
  }

  /** Személynevek text layerként hozzáadása */
  async addNameLayers(persons: Array<{ id: number; name: string; type: string }>, targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!persons || persons.length === 0) return { success: true };
    try {
      const result = await this.runJsx({ scriptName: 'actions/add-name-layers.jsx', personsData: persons, targetDocName });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addNameLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a név layerek hozzáadásakor' };
    }
  }

  /** Smart Object placeholder layerek hozzáadása */
  async addImageLayers(
    persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>,
    imageSizeCm = { widthCm: 10.4, heightCm: 15.4, dpi: 300 },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!persons || persons.length === 0) return { success: true };
    try {
      const result = await this.runJsx({
        scriptName: 'actions/add-image-layers.jsx',
        imageData: { persons, ...imageSizeCm, studentSizeCm: this.settings.studentSizeCm(), teacherSizeCm: this.settings.teacherSizeCm() },
        targetDocName,
      });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addImageLayers hiba', err);
      return { success: false, error: 'Váratlan hiba az image layerek hozzáadásakor' };
    }
  }

  /** Extra nevek beillesztése/frissítése */
  async addExtraNames(
    extraNames: { students: string; teachers: string },
    options: { includeStudents: boolean; includeTeachers: boolean },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const jsonData: Record<string, unknown> = {
        includeStudents: options.includeStudents,
        includeTeachers: options.includeTeachers,
        font: 'ArialMT', fontSize: 20, headerFontSize: 22,
        textColor: { r: 0, g: 0, b: 0 },
        textAlign: this.settings.textAlign(),
      };
      const normalizeNames = (text: string): string =>
        text.split(/\n/).map(n => n.trim()).filter(Boolean).join('\r');
      if (options.includeStudents && extraNames.students) {
        jsonData['students'] = { header: 'Osztálytársaink voltak még:', names: normalizeNames(extraNames.students) };
      }
      if (options.includeTeachers && extraNames.teachers) {
        jsonData['teachers'] = { header: 'Tanítottak még:', names: normalizeNames(extraNames.teachers) };
      }
      const result = await this.runJsx({ scriptName: 'actions/add-extra-names.jsx', jsonData, targetDocName });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addExtraNames hiba', err);
      return { success: false, error: 'Váratlan hiba az extra nevek beillesztésekor' };
    }
  }

  /** Grid elrendezés */
  async arrangeGrid(
    boardSize: { widthCm: number; heightCm: number },
    targetDocName?: string,
    linkedLayerNames?: string[],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      if (linkedLayerNames?.length) await this.unlinkLayers(linkedLayerNames, targetDocName);
      const result = await this.runJsx({
        scriptName: 'actions/arrange-grid.jsx',
        jsonData: {
          boardWidthCm: boardSize.widthCm, boardHeightCm: boardSize.heightCm,
          marginCm: this.settings.marginCm(), studentSizeCm: this.settings.studentSizeCm(),
          teacherSizeCm: this.settings.teacherSizeCm(), gapHCm: this.settings.gapHCm(),
          gapVCm: this.settings.gapVCm(), gridAlign: this.settings.gridAlign(),
        },
        targetDocName,
      });
      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) await this.linkLayers([name], targetDocName);
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeGrid hiba', err);
      return { success: false, error: 'Váratlan hiba a grid elrendezésnél' };
    }
  }

  /** Nevek rendezése */
  async arrangeNames(targetDocName?: string, linkedLayerNames?: string[]): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      if (linkedLayerNames?.length) await this.unlinkLayers(linkedLayerNames, targetDocName);
      const result = await this.runJsx({
        scriptName: 'actions/arrange-names.jsx',
        jsonData: { nameGapCm: this.settings.nameGapCm(), textAlign: this.settings.textAlign(), nameBreakAfter: this.settings.nameBreakAfter() },
        targetDocName,
      });
      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) await this.linkLayers([name], targetDocName);
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeNames hiba', err);
      return { success: false, error: 'Váratlan hiba a nevek rendezésénél' };
    }
  }

  /** Feliratok pozícionálása */
  async arrangeSubtitles(
    freeZone: { topPx: number; bottomPx: number },
    subtitleGapPx = 30,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.runJsx({
        scriptName: 'actions/arrange-subtitles.jsx',
        jsonData: { freeZoneTopPx: freeZone.topPx, freeZoneBottomPx: freeZone.bottomPx, subtitleGapPx },
        targetDocName,
      });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeSubtitles hiba', err);
      return { success: false, error: 'Váratlan hiba a feliratok pozícionálásakor' };
    }
  }

  /** Teljes tablóelrendezés: tanárok fent, feliratok középen, diákok lent */
  async arrangeTabloLayout(
    boardSize: { widthCm: number; heightCm: number },
    targetDocName?: string,
    linkedLayerNames?: string[],
    layoutConfig?: TabloLayoutConfig,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      if (linkedLayerNames?.length) await this.unlinkLayers(linkedLayerNames, targetDocName);
      const jsonData: Record<string, unknown> = {
        boardWidthCm: boardSize.widthCm, boardHeightCm: boardSize.heightCm,
        marginCm: this.settings.marginCm(), studentSizeCm: this.settings.studentSizeCm(),
        teacherSizeCm: this.settings.teacherSizeCm(),
        gapHCm: layoutConfig?.gapHCm ?? this.settings.gapHCm(),
        gapVCm: layoutConfig?.gapVCm ?? this.settings.gapVCm(),
        gridAlign: layoutConfig?.gridAlign ?? this.settings.gridAlign(),
        tabloLayout: true,
      };
      if (layoutConfig) {
        jsonData['studentMaxPerRow'] = layoutConfig.studentMaxPerRow;
        jsonData['teacherMaxPerRow'] = layoutConfig.teacherMaxPerRow;
      }
      const gridResult = await this.runJsx({ scriptName: 'actions/arrange-grid.jsx', jsonData, targetDocName });
      if (!gridResult.success) return { success: false, error: gridResult.error || 'Grid elrendezés sikertelen' };

      let freeZone: { topPx: number; bottomPx: number } | null = null;
      if (gridResult.output) {
        try {
          const parsed = JSON.parse(gridResult.output);
          if (parsed.freeZoneTopPx !== undefined && parsed.freeZoneBottomPx !== undefined) {
            freeZone = { topPx: parsed.freeZoneTopPx, bottomPx: parsed.freeZoneBottomPx };
          }
        } catch { /* parse hiba — folytatjuk */ }
      }

      await this.runJsx({
        scriptName: 'actions/arrange-names.jsx',
        jsonData: { nameGapCm: this.settings.nameGapCm(), textAlign: 'center', nameBreakAfter: this.settings.nameBreakAfter() },
        targetDocName,
      });

      if (freeZone) await this.arrangeSubtitles(freeZone, 30, targetDocName);

      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) await this.linkLayers([name], targetDocName);
      }
      return { success: true };
    } catch (err) {
      this.logger.error('JSX arrangeTabloLayout hiba', err);
      return { success: false, error: 'Váratlan hiba a tablóelrendezésnél' };
    }
  }

  /** Pozíció layerek frissítése/létrehozása */
  async updatePositions(
    persons: Array<{ id: number; name: string; type: string; title: string | null }>,
    targetDocName?: string,
    linkedLayerNames?: string[],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      if (linkedLayerNames?.length) await this.unlinkLayers(linkedLayerNames, targetDocName);
      const jsxPersons = persons.map(p => ({
        layerName: this.psdService.sanitizeName(p.name) + '---' + p.id,
        displayText: p.name,
        position: p.title || null,
        group: p.type === 'student' ? 'Students' : 'Teachers',
      }));
      const result = await this.runJsx({
        scriptName: 'actions/update-positions.jsx',
        jsonData: {
          persons: jsxPersons, nameBreakAfter: this.settings.nameBreakAfter(),
          textAlign: this.settings.textAlign(), nameGapCm: this.settings.nameGapCm(),
          positionGapCm: this.settings.positionGapCm(), positionFontSize: this.settings.positionFontSize(),
        },
        targetDocName,
      });
      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) await this.linkLayers([name], targetDocName);
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX updatePositions hiba', err);
      return { success: false, error: 'Váratlan hiba a pozíciók frissítésénél' };
    }
  }

  /** Fotók behelyezése Smart Object layerekbe */
  async placePhotos(layers: Array<{ layerName: string; photoUrl: string }>, targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!layers || layers.length === 0) return { success: true };
    try {
      const result = await this.api.placePhotos({ layers, targetDocName, psdFilePath: this.pathService.psdPath() ?? undefined });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX placePhotos hiba', err);
      return { success: false, error: 'Váratlan hiba a fotók behelyezésekor' };
    }
  }

  /** Layerek összelinkelése */
  async linkLayers(layerNames: string[], targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!layerNames || layerNames.length === 0) return { success: true };
    try {
      const result = await this.runJsx({ scriptName: 'actions/link-layers.jsx', jsonData: { layerNames }, targetDocName });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX linkLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a layerek összelinkelésekor' };
    }
  }

  /** Layerek linkelésének megszüntetése */
  async unlinkLayers(layerNames: string[], targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!layerNames || layerNames.length === 0) return { success: true };
    try {
      const result = await this.runJsx({ scriptName: 'actions/unlink-layers.jsx', jsonData: { layerNames }, targetDocName });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX unlinkLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a layerek linkelés megszüntetésekor' };
    }
  }

  /** Layerek átméretezése */
  async resizeLayers(params: {
    layerNames: string[]; width: number | null; height: number | null; unit: 'cm' | 'px';
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    if (!params.layerNames || params.layerNames.length === 0) return { success: true };
    try {
      const result = await this.runJsx({ scriptName: 'actions/resize-layers.jsx', jsonData: params });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX resizeLayers hiba', err);
      return { success: false, error: 'Váratlan hiba az átméretezéskor' };
    }
  }

  /** Csoport + SO layerek hozzáadása */
  async addGroupLayers(params: {
    groupName: string;
    sourceFiles: Array<{ filePath: string }>;
    layers: Array<{ layerName: string; group: 'Students' | 'Teachers'; x: number; y: number; sourceIndex: number }>;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.runJsx({ scriptName: 'actions/add-group-layers.jsx', jsonData: params });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addGroupLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a csoport layerek hozzáadásakor' };
    }
  }

  /** Teljes layout kiolvasás v3 formátumban */
  async readFullLayout(
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{
    success: boolean; error?: string;
    data?: {
      document: { name: string; widthPx: number; heightPx: number; dpi: number };
      layers: SnapshotLayer[];
      board: Record<string, unknown>;
      nameSettings: Record<string, unknown>;
    };
  }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const jsxResult = await this.runJsx({ scriptName: 'actions/read-layout.jsx', targetDocName });
      if (!jsxResult.success || !jsxResult.output) return { success: false, error: jsxResult.error || 'Layout kiolvasás sikertelen' };

      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = jsxResult.output.indexOf(jsonPrefix);
      if (jsonStart === -1) return { success: false, error: 'A JSX nem adott vissza layout adatot' };

      const jsonStr = jsxResult.output.substring(jsonStart + jsonPrefix.length).trim();
      let layoutResult: { document: { name: string; widthPx: number; heightPx: number; dpi: number }; layers: SnapshotLayer[] };
      try { layoutResult = JSON.parse(jsonStr); } catch { return { success: false, error: 'Layout JSON parse hiba' }; }

      return {
        success: true,
        data: {
          document: layoutResult.document,
          layers: layoutResult.layers || [],
          board: {
            widthCm: boardConfig.widthCm, heightCm: boardConfig.heightCm,
            marginCm: this.settings.marginCm(), gapHCm: this.settings.gapHCm(),
            gapVCm: this.settings.gapVCm(), gridAlign: this.settings.gridAlign(),
          },
          nameSettings: {
            nameGapCm: this.settings.nameGapCm(), textAlign: this.settings.textAlign(),
            nameBreakAfter: this.settings.nameBreakAfter(),
          },
        },
      };
    } catch (err) {
      this.logger.error('readFullLayout hiba', err);
      return { success: false, error: 'Váratlan hiba a layout olvasásnál' };
    }
  }
}

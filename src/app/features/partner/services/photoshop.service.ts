import { Injectable, inject, computed } from '@angular/core';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';
import { PhotoshopSnapshotService } from './photoshop-snapshot.service';
import { PhotoshopTemplateService } from './photoshop-template.service';
import { PhotoshopSampleService } from './photoshop-sample.service';
import { TabloSize } from '../models/partner.models';
import { TabloLayoutConfig } from '../pages/project-tablo-editor/layout-designer/layout-designer.types';

/**
 * PhotoshopService — Facade: delegálás a sub-service-ekhez.
 * Backward compat: minden publikus signal/metódus elérhető a régi API-n keresztül.
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopService {
  private readonly pathSvc = inject(PhotoshopPathService);
  private readonly settingsSvc = inject(PhotoshopSettingsService);
  private readonly psdSvc = inject(PhotoshopPsdService);
  private readonly jsxSvc = inject(PhotoshopJsxService);
  private readonly snapshotSvc = inject(PhotoshopSnapshotService);
  private readonly templateSvc = inject(PhotoshopTemplateService);
  private readonly sampleSvc = inject(PhotoshopSampleService);

  // ============ Path signals ============
  readonly path = this.pathSvc.path;
  readonly workDir = this.pathSvc.workDir;
  readonly isConfigured = this.pathSvc.isConfigured;
  readonly checking = this.pathSvc.checking;
  readonly psdPath = this.pathSvc.psdPath;

  // ============ Settings signals ============
  readonly marginCm = this.settingsSvc.marginCm;
  readonly studentSizeCm = this.settingsSvc.studentSizeCm;
  readonly teacherSizeCm = this.settingsSvc.teacherSizeCm;
  readonly gapHCm = this.settingsSvc.gapHCm;
  readonly gapVCm = this.settingsSvc.gapVCm;
  readonly nameGapCm = this.settingsSvc.nameGapCm;
  readonly nameBreakAfter = this.settingsSvc.nameBreakAfter;
  readonly textAlign = this.settingsSvc.textAlign;
  readonly gridAlign = this.settingsSvc.gridAlign;
  readonly positionGapCm = this.settingsSvc.positionGapCm;
  readonly positionFontSize = this.settingsSvc.positionFontSize;
  readonly sampleSizeLarge = this.settingsSvc.sampleSizeLarge;
  readonly sampleSizeSmall = this.settingsSvc.sampleSizeSmall;
  readonly sampleWatermarkText = this.settingsSvc.sampleWatermarkText;
  readonly sampleWatermarkColor = this.settingsSvc.sampleWatermarkColor;
  readonly sampleWatermarkOpacity = this.settingsSvc.sampleWatermarkOpacity;
  readonly sampleUseLargeSize = this.settingsSvc.sampleUseLargeSize;

  // ============ Path methods ============
  async detectPhotoshop() {
    await this.pathSvc.detectPath();
    await this.settingsSvc.loadSavedSettings();
    await this.settingsSvc.loadSampleSettings();
  }
  setPath(p: string) { return this.pathSvc.setPath(p); }
  launchPhotoshop() { return this.pathSvc.launchPhotoshop(); }
  browseForPhotoshop() { return this.pathSvc.browseForPhotoshop(); }
  setWorkDir(d: string) { return this.pathSvc.setWorkDir(d); }
  browseForWorkDir() { return this.pathSvc.browseForWorkDir(); }
  openPsdFile(p: string) { return this.pathSvc.openPsdFile(p); }
  revealInFinder(p: string) { this.pathSvc.revealInFinder(p); }
  checkPsdExists(p: string) { return this.pathSvc.checkPsdExists(p); }
  backupPsd(p: string) { return this.pathSvc.backupPsd(p); }

  // ============ Settings methods ============
  setMargin(v: number) { return this.settingsSvc.setMargin(v); }
  setStudentSize(v: number) { return this.settingsSvc.setStudentSize(v); }
  setTeacherSize(v: number) { return this.settingsSvc.setTeacherSize(v); }
  setGapH(v: number) { return this.settingsSvc.setGapH(v); }
  setGapV(v: number) { return this.settingsSvc.setGapV(v); }
  setNameGap(v: number) { return this.settingsSvc.setNameGap(v); }
  setNameBreakAfter(v: number) { return this.settingsSvc.setNameBreakAfter(v); }
  setTextAlign(v: string) { return this.settingsSvc.setTextAlign(v); }
  setGridAlign(v: string) { return this.settingsSvc.setGridAlign(v); }
  setPositionGap(v: number) { return this.settingsSvc.setPositionGap(v); }
  setPositionFontSize(v: number) { return this.settingsSvc.setPositionFontSize(v); }
  setSampleSettings(s: Parameters<PhotoshopSettingsService['setSampleSettings']>[0]) { return this.settingsSvc.setSampleSettings(s); }

  // ============ PSD methods ============
  parseSizeValue(v: string) { return this.psdSvc.parseSizeValue(v); }
  sanitizeName(t: string) { return this.psdSvc.sanitizeName(t); }
  sanitizePathName(t: string) { return this.psdSvc.sanitizePathName(t); }
  buildProjectFolderName(ctx: Parameters<PhotoshopPsdService['buildProjectFolderName']>[0]) { return this.psdSvc.buildProjectFolderName(ctx); }
  computePsdPath(sizeValue: string, context?: Parameters<PhotoshopPsdService['computePsdPath']>[1]) { return this.psdSvc.computePsdPath(sizeValue, context); }
  generateAndOpenPsd(size: TabloSize, context?: Parameters<PhotoshopPsdService['generateAndOpenPsd']>[1]) { return this.psdSvc.generateAndOpenPsd(size, context); }
  saveTempFiles(files: File[]) { return this.psdSvc.saveTempFiles(files); }
  saveAndCloseDocument(targetDocName?: string) { return this.psdSvc.saveAndCloseDocument(targetDocName); }

  // ============ JSX methods ============
  addGuides(targetDocName?: string) { return this.jsxSvc.addGuides(targetDocName); }
  buildSubtitles(ctx: Parameters<PhotoshopJsxService['buildSubtitles']>[0]) { return this.jsxSvc.buildSubtitles(ctx); }
  addSubtitleLayers(subtitles: Parameters<PhotoshopJsxService['addSubtitleLayers']>[0], targetDocName?: string) { return this.jsxSvc.addSubtitleLayers(subtitles, targetDocName); }
  addNameLayers(persons: Parameters<PhotoshopJsxService['addNameLayers']>[0], targetDocName?: string) { return this.jsxSvc.addNameLayers(persons, targetDocName); }
  addImageLayers(persons: Parameters<PhotoshopJsxService['addImageLayers']>[0], imageSizeCm?: Parameters<PhotoshopJsxService['addImageLayers']>[1], targetDocName?: string) { return this.jsxSvc.addImageLayers(persons, imageSizeCm, targetDocName); }
  addExtraNames(en: Parameters<PhotoshopJsxService['addExtraNames']>[0], opts: Parameters<PhotoshopJsxService['addExtraNames']>[1], targetDocName?: string) { return this.jsxSvc.addExtraNames(en, opts, targetDocName); }
  arrangeGrid(boardSize: { widthCm: number; heightCm: number }, targetDocName?: string, linkedLayerNames?: string[]) { return this.jsxSvc.arrangeGrid(boardSize, targetDocName, linkedLayerNames); }
  arrangeNames(targetDocName?: string, linkedLayerNames?: string[]) { return this.jsxSvc.arrangeNames(targetDocName, linkedLayerNames); }
  arrangeSubtitles(freeZone: { topPx: number; bottomPx: number }, subtitleGapPx?: number, targetDocName?: string) { return this.jsxSvc.arrangeSubtitles(freeZone, subtitleGapPx, targetDocName); }
  arrangeTabloLayout(boardSize: { widthCm: number; heightCm: number }, targetDocName?: string, linkedLayerNames?: string[], layoutConfig?: TabloLayoutConfig) { return this.jsxSvc.arrangeTabloLayout(boardSize, targetDocName, linkedLayerNames, layoutConfig); }
  updatePositions(persons: Parameters<PhotoshopJsxService['updatePositions']>[0], targetDocName?: string, linkedLayerNames?: string[]) { return this.jsxSvc.updatePositions(persons, targetDocName, linkedLayerNames); }
  placePhotos(layers: Parameters<PhotoshopJsxService['placePhotos']>[0], targetDocName?: string) { return this.jsxSvc.placePhotos(layers, targetDocName); }
  linkLayers(layerNames: string[], targetDocName?: string) { return this.jsxSvc.linkLayers(layerNames, targetDocName); }
  unlinkLayers(layerNames: string[], targetDocName?: string) { return this.jsxSvc.unlinkLayers(layerNames, targetDocName); }
  resizeLayers(params: Parameters<PhotoshopJsxService['resizeLayers']>[0]) { return this.jsxSvc.resizeLayers(params); }
  addGroupLayers(params: Parameters<PhotoshopJsxService['addGroupLayers']>[0]) { return this.jsxSvc.addGroupLayers(params); }
  readFullLayout(boardConfig: { widthCm: number; heightCm: number }, targetDocName?: string) { return this.jsxSvc.readFullLayout(boardConfig, targetDocName); }

  // ============ Snapshot methods ============
  saveSnapshot(name: string, boardConfig: { widthCm: number; heightCm: number }, psdPath: string, targetDocName?: string) { return this.snapshotSvc.saveSnapshot(name, boardConfig, psdPath, targetDocName); }
  listSnapshots(psdPath: string) { return this.snapshotSvc.listSnapshots(psdPath); }
  restoreSnapshot(snapshotPath: string, targetDocName?: string, restoreGroups?: string[][]) { return this.snapshotSvc.restoreSnapshot(snapshotPath, targetDocName, restoreGroups); }
  deleteSnapshot(snapshotPath: string) { return this.snapshotSvc.deleteSnapshot(snapshotPath); }
  loadSnapshot(snapshotPath: string) { return this.snapshotSvc.loadSnapshot(snapshotPath); }
  saveSnapshotData(psdPath: string, data: Record<string, unknown>, fileName: string) { return this.snapshotSvc.saveSnapshotData(psdPath, data, fileName); }
  saveSnapshotDataAsNew(psdPath: string, data: Record<string, unknown>, originalName: string) { return this.snapshotSvc.saveSnapshotDataAsNew(psdPath, data, originalName); }
  saveSnapshotWithFileName(psdPath: string, data: Record<string, unknown>, fileName: string) { return this.snapshotSvc.saveSnapshotWithFileName(psdPath, data, fileName); }
  renameSnapshot(snapshotPath: string, newName: string) { return this.snapshotSvc.renameSnapshot(snapshotPath, newName); }
  readAndSaveLayout(boardConfig: { widthCm: number; heightCm: number }, psdPath: string, targetDocName?: string, projectId?: number) { return this.snapshotSvc.readAndSaveLayout(boardConfig, psdPath, targetDocName, projectId); }

  // ============ Template methods ============
  saveTemplate(name: string, boardConfig: { widthCm: number; heightCm: number }, targetDocName?: string) { return this.templateSvc.saveTemplate(name, boardConfig, targetDocName); }
  listTemplates() { return this.templateSvc.listTemplates(); }
  loadTemplate(templateId: string) { return this.templateSvc.loadTemplate(templateId); }
  deleteTemplate(templateId: string) { return this.templateSvc.deleteTemplate(templateId); }
  renameTemplate(templateId: string, newName: string) { return this.templateSvc.renameTemplate(templateId, newName); }
  applyTemplate(templateId: string, targetDocName?: string) { return this.templateSvc.applyTemplate(templateId, targetDocName); }

  // ============ Sample/Final methods ============
  generateSample(projectId: number, projectName: string, largeSize?: boolean, context?: { schoolName?: string | null; className?: string | null }) { return this.sampleSvc.generateSample(projectId, projectName, largeSize, context); }
  generateFinal(projectId: number, projectName: string, context?: { schoolName?: string | null; className?: string | null }) { return this.sampleSvc.generateFinal(projectId, projectName, context); }
  generateSmallTablo(projectId: number, projectName: string, context?: { schoolName?: string | null; className?: string | null }) { return this.sampleSvc.generateSmallTablo(projectId, projectName, context); }
}

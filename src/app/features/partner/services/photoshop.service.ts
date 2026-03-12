import { Injectable, inject } from '@angular/core';
import { SnapshotListItem, TemplateListItem, GlobalTemplate } from '@core/services/electron.types';
import { TabloSize } from '../models/partner.models';
import { TabloLayoutConfig } from '../pages/project-tablo-editor/layout-designer/layout-designer.types';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';
import { PhotoshopSnapshotService } from './photoshop-snapshot.service';
import { PhotoshopTemplateService } from './photoshop-template.service';
import { PhotoshopSampleService } from './photoshop-sample.service';

/**
 * PhotoshopService — Facade a Photoshop sub-service-ekhez.
 * Visszafelé kompatibilis API — a korábbi metódusok és signal-ök megmaradnak.
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

  // === SIGNALS (delegálva a sub-service-ekből) ===

  readonly path = this.pathSvc.path;
  readonly workDir = this.pathSvc.workDir;
  readonly isConfigured = this.pathSvc.isConfigured;
  readonly checking = this.pathSvc.checking;
  readonly psdPath = this.pathSvc.psdPath;

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

  // === PATH ===

  detectPhotoshop() { return this.pathSvc.detectPath(); }
  setPath(p: string) { return this.pathSvc.setPath(p); }
  launchPhotoshop() { return this.pathSvc.launchPhotoshop(); }
  setWorkDir(d: string) { return this.pathSvc.setWorkDir(d); }
  browseForWorkDir() { return this.pathSvc.browseForWorkDir(); }
  browseForPhotoshop() { return this.pathSvc.browseForPhotoshop(); }
  openPsdFile(p: string) { return this.pathSvc.openPsdFile(p); }
  revealInFinder(p: string) { return this.pathSvc.revealInFinder(p); }
  checkPsdExists(p: string) { return this.pathSvc.checkPsdExists(p); }
  backupPsd(p: string) { return this.pathSvc.backupPsd(p); }

  // === SETTINGS ===

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

  // === PSD ===

  parseSizeValue(v: string) { return this.psdSvc.parseSizeValue(v); }
  sanitizeName(t: string) { return this.psdSvc.sanitizeName(t); }
  sanitizePathName(t: string) { return this.psdSvc.sanitizePathName(t); }
  buildProjectFolderName(ctx: Parameters<PhotoshopPsdService['buildProjectFolderName']>[0]) { return this.psdSvc.buildProjectFolderName(ctx); }
  computePsdPath(...args: Parameters<PhotoshopPsdService['computePsdPath']>) { return this.psdSvc.computePsdPath(...args); }
  computeProjectFolderPath(ctx: Parameters<PhotoshopPsdService['computeProjectFolderPath']>[0]) { return this.psdSvc.computeProjectFolderPath(ctx); }
  findProjectPsd(p: string) { return this.psdSvc.findProjectPsd(p); }
  generateAndOpenPsd(size: TabloSize, ctx?: Parameters<PhotoshopPsdService['generateAndOpenPsd']>[1]) { return this.psdSvc.generateAndOpenPsd(size, ctx); }
  saveTempFiles(f: File[]) { return this.psdSvc.saveTempFiles(f); }
  saveAndCloseDocument(d?: string) { return this.psdSvc.saveAndCloseDocument(d); }

  // === JSX ===

  addGuides(d?: string) { return this.jsxSvc.addGuides(d); }
  buildSubtitles(ctx: Parameters<PhotoshopJsxService['buildSubtitles']>[0]) { return this.jsxSvc.buildSubtitles(ctx); }
  addSubtitleLayers(...args: Parameters<PhotoshopJsxService['addSubtitleLayers']>) { return this.jsxSvc.addSubtitleLayers(...args); }
  addNameLayers(...args: Parameters<PhotoshopJsxService['addNameLayers']>) { return this.jsxSvc.addNameLayers(...args); }
  addImageLayers(...args: Parameters<PhotoshopJsxService['addImageLayers']>) { return this.jsxSvc.addImageLayers(...args); }
  addExtraNames(...args: Parameters<PhotoshopJsxService['addExtraNames']>) { return this.jsxSvc.addExtraNames(...args); }
  arrangeGrid(...args: Parameters<PhotoshopJsxService['arrangeGrid']>) { return this.jsxSvc.arrangeGrid(...args); }
  arrangeNames(d?: string, l?: string[]) { return this.jsxSvc.arrangeNames(d, l); }
  arrangeSubtitles(...args: Parameters<PhotoshopJsxService['arrangeSubtitles']>) { return this.jsxSvc.arrangeSubtitles(...args); }
  arrangeTabloLayout(
    b: { widthCm: number; heightCm: number }, d?: string, l?: string[], cfg?: TabloLayoutConfig,
  ) { return this.jsxSvc.arrangeTabloLayout(b, d, l, cfg); }
  updatePositions(...args: Parameters<PhotoshopJsxService['updatePositions']>) { return this.jsxSvc.updatePositions(...args); }
  relocateLayers(...args: Parameters<PhotoshopJsxService['relocateLayers']>) { return this.jsxSvc.relocateLayers(...args); }
  readFullLayout(...args: Parameters<PhotoshopJsxService['readFullLayout']>) { return this.jsxSvc.readFullLayout(...args); }
  placePhotos(...args: Parameters<PhotoshopJsxService['placePhotos']>) { return this.jsxSvc.placePhotos(...args); }
  linkLayers(n: string[], d?: string) { return this.jsxSvc.linkLayers(n, d); }
  unlinkLayers(n: string[], d?: string) { return this.jsxSvc.unlinkLayers(n, d); }
  resizeLayers(p: Parameters<PhotoshopJsxService['resizeLayers']>[0]) { return this.jsxSvc.resizeLayers(p); }
  applyCircleMask(p: Parameters<PhotoshopJsxService['applyCircleMask']>[0]) { return this.jsxSvc.applyCircleMask(p); }
  removeMasks(p: Parameters<PhotoshopJsxService['removeMasks']>[0]) { return this.jsxSvc.removeMasks(p); }
  addPlaceholderTexts(p: Parameters<PhotoshopJsxService['addPlaceholderTexts']>[0]) { return this.jsxSvc.addPlaceholderTexts(p); }
  addGroupLayers(p: Parameters<PhotoshopJsxService['addGroupLayers']>[0]) { return this.jsxSvc.addGroupLayers(p); }
  closeDocumentWithoutSaving(d?: string) { return this.jsxSvc.closeDocumentWithoutSaving(d); }

  // === SNAPSHOT ===

  readAndSaveLayout(...args: Parameters<PhotoshopSnapshotService['readAndSaveLayout']>) { return this.snapshotSvc.readAndSaveLayout(...args); }
  saveSnapshot(...args: Parameters<PhotoshopSnapshotService['saveSnapshot']>) { return this.snapshotSvc.saveSnapshot(...args); }
  listSnapshots(p: string): Promise<SnapshotListItem[]> { return this.snapshotSvc.listSnapshots(p); }
  restoreSnapshot(...args: Parameters<PhotoshopSnapshotService['restoreSnapshot']>) { return this.snapshotSvc.restoreSnapshot(...args); }
  deleteSnapshot(p: string) { return this.snapshotSvc.deleteSnapshot(p); }
  loadSnapshot(p: string) { return this.snapshotSvc.loadSnapshot(p); }
  saveSnapshotData(...args: Parameters<PhotoshopSnapshotService['saveSnapshotData']>) { return this.snapshotSvc.saveSnapshotData(...args); }
  saveSnapshotDataAsNew(...args: Parameters<PhotoshopSnapshotService['saveSnapshotDataAsNew']>) { return this.snapshotSvc.saveSnapshotDataAsNew(...args); }
  saveSnapshotWithFileName(...args: Parameters<PhotoshopSnapshotService['saveSnapshotWithFileName']>) { return this.snapshotSvc.saveSnapshotWithFileName(...args); }
  renameSnapshot(p: string, n: string) { return this.snapshotSvc.renameSnapshot(p, n); }

  // === TEMPLATE ===

  saveTemplate(...args: Parameters<PhotoshopTemplateService['saveTemplate']>) { return this.templateSvc.saveTemplate(...args); }
  listTemplates(): Promise<TemplateListItem[]> { return this.templateSvc.listTemplates(); }
  loadTemplate(id: string): Promise<{ success: boolean; error?: string; data?: GlobalTemplate }> { return this.templateSvc.loadTemplate(id); }
  deleteTemplate(id: string) { return this.templateSvc.deleteTemplate(id); }
  renameTemplate(id: string, n: string) { return this.templateSvc.renameTemplate(id, n); }
  applyTemplate(id: string, d?: string) { return this.templateSvc.applyTemplate(id, d); }

  // === SAMPLE ===

  generateSample(...args: Parameters<PhotoshopSampleService['generateSample']>) { return this.sampleSvc.generateSample(...args); }
  generateFinal(...args: Parameters<PhotoshopSampleService['generateFinal']>) { return this.sampleSvc.generateFinal(...args); }
  generateSmallTablo(...args: Parameters<PhotoshopSampleService['generateSmallTablo']>) { return this.sampleSvc.generateSmallTablo(...args); }
}

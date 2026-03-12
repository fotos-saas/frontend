import { Injectable, inject, NgZone, signal } from '@angular/core';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayEffectsService } from './overlay-effects.service';

type QaTarget = 'all' | 'students' | 'teachers';

interface JsxResult {
  success?: boolean;
  output?: string;
  error?: string;
  arranged?: number;
  refreshed?: number;
  nameMapCount?: number;
  linked?: number;
  unlinked?: number;
  reordered?: number;
}

interface JsxLinkData {
  linked?: number;
  unlinked?: number;
  names?: string[];
  error?: string;
}

@Injectable()
export class OverlayQuickActionsService {
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly projectService = inject(OverlayProjectService);
  private readonly settings = inject(OverlaySettingsService);
  private readonly sortService = inject(OverlaySortService);
  private readonly ngZone = inject(NgZone);
  readonly effects = inject(OverlayEffectsService);

  readonly panelOpen = signal(false);
  readonly refreshNames = signal(true);
  readonly refreshPositions = signal(false);
  readonly positionNames = signal(true);
  readonly positionPositions = signal(false);
  readonly confirm = signal<{ action: string; target: string } | null>(null);
  readonly loading = signal(false);
  readonly reorderTarget = signal<QaTarget>('all');
  readonly specPanelOpen = signal(false);

  // Delegált signal-ok az effects service-ből
  readonly gridPanelOpen = this.effects.gridPanelOpen;
  readonly gridGapPx = this.effects.gridGapPx;
  readonly gridAlignTop = this.effects.gridAlignTop;
  readonly gridLayerCount = this.effects.gridLayerCount;
  readonly gridUnit = this.effects.gridUnit;
  readonly gridCols = this.effects.gridCols;
  readonly gridRows = this.effects.gridRows;
  readonly gridGapH = this.effects.gridGapH;
  readonly gridGapV = this.effects.gridGapV;
  readonly gridAlign = this.effects.gridAlign;
  readonly imagesOnly = this.effects.imagesOnly;
  readonly gridGapDisplay = this.effects.gridGapDisplay;
  readonly gridGapHDisplay = this.effects.gridGapHDisplay;
  readonly gridGapVDisplay = this.effects.gridGapVDisplay;
  readonly rotatePanelOpen = this.effects.rotatePanelOpen;
  readonly rotateAngle = this.effects.rotateAngle;
  readonly rotateRandom = this.effects.rotateRandom;
  readonly borderRadius = this.effects.borderRadius;
  readonly borderRadiusUseSelected = this.effects.borderRadiusUseSelected;
  readonly result = this.effects.result;

  private projectIdResolver: () => number | undefined = () => undefined;

  constructor() {
    this.effects.configure({ getLayerNames: (target: string) => this.getLayerNames(target) });
  }

  setProjectIdResolver(fn: () => number | undefined): void { this.projectIdResolver = fn; }

  // === Panel kezelés ===

  togglePanel(): void { this.panelOpen.update(v => !v); this.effects.gridPanelOpen.set(false); this.effects.rotatePanelOpen.set(false); this.specPanelOpen.set(false); }
  closePanel(): void { this.panelOpen.set(false); }

  toggleSpecPanel(): void { this.specPanelOpen.update(v => !v); this.panelOpen.set(false); this.effects.gridPanelOpen.set(false); this.effects.rotatePanelOpen.set(false); }
  closeSpecPanel(): void { this.specPanelOpen.set(false); }

  toggleGridPanel(): void { this.effects.toggleGridPanel(); this.panelOpen.set(false); this.specPanelOpen.set(false); }
  closeGridPanel(): void { this.effects.closeGridPanel(); }
  toggleRotatePanel(): void { this.effects.toggleRotatePanel(); this.panelOpen.set(false); this.specPanelOpen.set(false); }
  closeRotatePanel(): void { this.effects.closeRotatePanel(); }

  toggleGridUnit(): void { this.effects.toggleGridUnit(); }
  setGridGapHFromDisplay(value: number): void { this.effects.setGridGapHFromDisplay(value); }
  setGridGapVFromDisplay(value: number): void { this.effects.setGridGapVFromDisplay(value); }
  setGridGapFromDisplay(value: number): void { this.effects.setGridGapFromDisplay(value); }

  toggleType(action: 'refresh' | 'position', type: 'names' | 'positions'): void {
    if (action === 'refresh') {
      if (type === 'names') this.refreshNames.update(v => !v); else this.refreshPositions.update(v => !v);
    } else {
      if (type === 'names') this.positionNames.update(v => !v); else this.positionPositions.update(v => !v);
    }
  }

  onAction(action: string, target: string): void { this.confirm.set({ action, target }); }
  cancelAction(): void { this.confirm.set(null); }

  async confirmAction(): Promise<void> {
    const c = this.confirm();
    if (!c || this.loading()) return;
    this.confirm.set(null);
    this.loading.set(true);

    try {
      if (c.action === 'link') await this.executeLink(c.target);
      else if (c.action === 'position-labels') await this.executeArrange(c.target, this.positionNames(), this.positionPositions());
      else if (c.action === 'refresh-labels') await this.executeRefreshLabels(c.target, this.refreshNames(), this.refreshPositions());
      else if (c.action === 'sync-positions') await this.executeSyncPositions(c.target);
      else if (c.action === 'reposition-to-image') await this.executeRepositionToImage();
      else if (c.action === 'equalize-grid') await this.effects.executeEqualizeGrid();
      else if (c.action === 'grid-arrange') await this.effects.executeGridArrange();
      else if (c.action === 'border-radius') await this.effects.executeBorderRadius();
    } finally { this.loading.set(false); }
  }

  showLinkResult(result: JsxResult | null, type: 'link' | 'unlink'): void {
    try {
      if (!result?.output) { this.effects.setResult(false, 'Nincs válasz a Photoshoptól'); return; }
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) { this.effects.setResult(false, 'Érvénytelen válasz'); return; }
      const data: JsxLinkData = JSON.parse(cleaned);
      if (data.error) { this.effects.setResult(false, data.error); return; }
      const count = type === 'link' ? data.linked : data.unlinked;
      const verb = type === 'link' ? 'linkelve' : 'szétlinkelve';
      const nameCount = data.names?.length || 0;
      if (count === 0) { this.effects.setResult(false, 'Nem találtam linkelhető layereket'); return; }
      this.effects.setResult(true, `${count} layer ${verb} (${nameCount} név)`);
    } catch { this.effects.setResult(false, 'Hiba a válasz feldolgozásában'); }
  }

  // Delegált effekt metódusok
  setRotateAngle(value: number): void { this.effects.setRotateAngle(value); }
  toggleRotateRandom(): void { this.effects.toggleRotateRandom(); }
  setBorderRadius(value: number): void { this.effects.setBorderRadius(value); }
  applyRotateSelected(): Promise<void> { return this.effects.applyRotateSelected(); }
  applyBorderRadiusSelected(): Promise<void> { return this.effects.applyBorderRadiusSelected(); }
  alignTopOnly(): Promise<void> { return this.effects.alignTopOnly(); }
  measureGridGaps(): Promise<void> { return this.effects.measureGridGaps(); }
  executeCenterSelected(): Promise<void> { return this.effects.executeCenterSelected(); }

  // === Private: Execute metódusok ===

  private async executeLink(target: string): Promise<void> {
    const layerNames = await this.getLayerNames(target);
    if (layerNames.length === 0) {
      this.effects.setResult(false, `Nincsenek ${this.targetLabel(target, 'image')} layerek`);
      return;
    }
    const result = await this.ps.runJsx('link-layers', 'actions/link-selected.jsx', { LAYER_NAMES: layerNames.join('|') });
    this.showLinkResult(result, 'link');
  }

  private async executeArrange(target: string, doNames: boolean, doPositions: boolean): Promise<void> {
    if (!doNames && !doPositions) { this.effects.setResult(false, 'Válassz típust (Nevek és/vagy Pozíciók)'); return; }
    const result = await this.ps.runJsx('arrange-names', 'actions/arrange-names-selected.jsx', {
      TEXT_ALIGN: 'center', BREAK_AFTER: String(this.settings.nameBreakAfter()),
      NAME_GAP_CM: String(this.settings.nameGapCm()), TARGET_GROUP: this.targetGroup(target),
      SKIP_NAMES: doNames ? 'false' : 'true', SKIP_POSITIONS: doPositions ? 'false' : 'true',
    });
    const label = this.targetLabel(target);
    const typeLabel = doNames && doPositions ? 'név+pozíció' : doNames ? 'név' : 'pozíció';
    this.handleJsxResult(result, data => `${data['arranged']} ${typeLabel} rendezve (${label})`, `Rendezés kész (${label})`);
  }

  private async executeRefreshLabels(target: string, doNames: boolean, doPositions: boolean): Promise<void> {
    if (!doNames && !doPositions) { this.effects.setResult(false, 'Válassz típust (Nevek és/vagy Pozíciók)'); return; }
    if (doPositions) { await this.executeArrange(target, doNames, doPositions); return; }

    const persons = await this.forceRefreshPersons();
    if (persons.length === 0) { this.effects.setResult(false, 'Nincsenek személyek betöltve'); return; }
    const layerNames = await this.getLayerNames(target);
    const nameMap = this.buildNameMap(layerNames, persons);
    if (Object.keys(nameMap).length === 0) { this.effects.setResult(false, 'Nem találtam párosítható neveket'); return; }

    const result = await this.ps.runJsx('refresh-names', 'actions/refresh-name-texts.jsx', {
      NAME_MAP: JSON.stringify(nameMap), TARGET_GROUP: this.targetGroup(target),
      BREAK_AFTER: String(this.settings.nameBreakAfter()),
    });

    const label = this.targetLabel(target);
    this.handleJsxResult(result,
      r => {
        const noMatch = r['noMatch'] || 0;
        const skipped = r['skipped'] || 0;
        const debug = r['debugNoMatch'] ? ` [nincs match: ${(r['debugNoMatch'] as string[]).join(', ')}]` : '';
        return `${r['refreshed']} frissítve, ${skipped} változatlan, ${noMatch} nem párosított (${label}) [map:${r['nameMapCount']}, total:${r['total']}]${debug}`;
      },
      `Frissítés kész (${label})`,
    );
  }

  private async executeSyncPositions(target: string): Promise<void> {
    const persons = await this.forceRefreshPersons();
    if (persons.length === 0) { this.effects.setResult(false, 'Nincsenek személyek betöltve'); return; }
    const layerNames = await this.getLayerNames(target);
    if (layerNames.length === 0) {
      this.effects.setResult(false, `Nincsenek ${this.targetLabel(target, 'image')} layerek`);
      return;
    }

    const matches = this.matchLayerToPersons(layerNames, persons);
    const personsData = Array.from(matches.entries()).map(([ln, person]) => ({
      layerName: ln, displayText: person.name, position: person.title || null,
      group: person.type === 'teacher' ? 'Teachers' : 'Students',
    }));

    if (personsData.length === 0) {
      this.effects.setResult(false, `Nem találtam párosítható személyeket (${persons.length} személy, ${layerNames.length} layer)`);
      return;
    }

    const result = await this.ps.runJsx('sync-positions', 'actions/update-positions.jsx', {
      persons: personsData, nameBreakAfter: this.settings.nameBreakAfter(),
      textAlign: 'center', nameGapCm: this.settings.nameGapCm(), positionGapCm: 0.15, positionFontSize: 18,
    });

    const label = this.targetLabel(target);
    try {
      if (result?.output) {
        const lines = result.output.trim().split('\n');
        this.effects.setResult(true, `Pozíciók frissítve (${label}): ${lines[lines.length - 1]}`);
      } else {
        this.effects.setResult(true, `Pozíciók frissítve (${label})`);
      }
    } catch { this.effects.setResult(true, `Pozíciók frissítve (${label})`); }
  }

  private async executeRepositionToImage(): Promise<void> {
    const result = await this.ps.runJsx('reposition-to-image', 'actions/reposition-to-image.jsx', {});
    this.handleJsxResult(result, data => `${data['moved']} layer visszahelyezve`, 'Visszahelyezés kész');
  }

  // === Közös helperek ===

  private async forceRefreshPersons(): Promise<PersonItem[]> {
    const pid = this.projectService.getLastProjectId() || this.projectIdResolver();
    if (pid) return await this.projectService.fetchPersons(pid);
    return this.projectService.persons();
  }

  private async getLayerNames(target: string): Promise<string[]> {
    const data = await this.ps.getImageLayerData();
    if (target === 'teachers') return data.teachers;
    if (target === 'students') return data.students;
    return data.names;
  }

  private targetLabel(target: string, fallback = 'összes'): string {
    if (target === 'teachers') return 'tanár';
    if (target === 'students') return 'diák';
    return fallback;
  }

  private targetGroup(target: string): string {
    return target === 'teachers' || target === 'students' ? target : 'all';
  }

  private matchLayerToPersons(layerNames: string[], persons: PersonItem[]): Map<string, PersonItem> {
    const result = new Map<string, PersonItem>();
    const personById = new Map(persons.map(p => [p.id, p]));
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const personByNorm = new Map(persons.map(p => [normalize(p.name), p]));

    for (const ln of layerNames) {
      const sepIdx = ln.indexOf('---');
      if (sepIdx !== -1) {
        const pid = parseInt(ln.substring(sepIdx + 3), 10);
        if (pid > 0 && personById.has(pid)) { result.set(ln, personById.get(pid)!); continue; }
      }
      const humanName = this.sortService.slugToHumanName(ln);
      const person = personByNorm.get(normalize(humanName));
      if (person) result.set(ln, person);
    }
    return result;
  }

  private buildNameMap(layerNames: string[], persons: PersonItem[]): Record<string, string> {
    const matches = this.matchLayerToPersons(layerNames, persons);
    const nameMap: Record<string, string> = {};
    for (const [layerName, person] of matches) nameMap[layerName] = person.name;
    return nameMap;
  }

  private handleJsxResult(
    result: JsxResult | null,
    formatSuccess: (data: Record<string, unknown>) => string,
    fallbackMessage: string,
  ): void {
    try {
      if (result?.output) {
        const data: Record<string, unknown> = JSON.parse(result.output.trim());
        if (data['error']) { this.effects.setResult(false, String(data['error'])); return; }
        this.effects.setResult(true, formatSuccess(data));
      } else { this.effects.setResult(true, fallbackMessage); }
    } catch { this.effects.setResult(true, fallbackMessage); }
  }
}

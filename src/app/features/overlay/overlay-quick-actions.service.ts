import { Injectable, inject, NgZone, DestroyRef, signal, computed } from '@angular/core';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlaySortService } from './overlay-sort.service';

type QaTarget = 'all' | 'students' | 'teachers';

/** Photoshop JSX script futtatasi eredmeny */
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

/** Photoshop link/unlink muvelet parse-olt valasza */
interface JsxLinkData {
  linked?: number;
  unlinked?: number;
  names?: string[];
  error?: string;
}

/**
 * Gyors akciók üzleti logikája (link, arrange, refresh, sync-positions, reorder).
 * Kiemelve az overlay.component.ts-ből a redundancia csökkentése érdekében.
 */
@Injectable()
export class OverlayQuickActionsService {
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly projectService = inject(OverlayProjectService);
  private readonly settings = inject(OverlaySettingsService);
  private readonly sortService = inject(OverlaySortService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly RESULT_TIMEOUT_MS = 3000;

  // === Signals ===
  readonly panelOpen = signal(false);
  readonly refreshNames = signal(true);
  readonly refreshPositions = signal(false);
  readonly positionNames = signal(true);
  readonly positionPositions = signal(false);
  readonly confirm = signal<{ action: string; target: string } | null>(null);
  readonly loading = signal(false);
  readonly reorderTarget = signal<QaTarget>('all');
  readonly gridPanelOpen = signal(false);
  readonly gridGapPx = signal<number | null>(null);
  readonly gridAlignTop = signal(false);
  readonly gridLayerCount = signal(0);
  readonly gridUnit = signal<'px' | 'cm'>('cm');

  // === Grid rendezés ===
  readonly gridCols = signal(5);
  readonly gridRows = signal(0); // 0 = auto
  readonly gridGapH = signal(2);
  readonly gridGapV = signal(3);
  readonly gridAlign = signal<'left' | 'center' | 'right'>('center');
  readonly gridGapDisplay = computed(() => {
    const px = this.gridGapPx();
    if (px === null) return null;
    return this.gridUnit() === 'cm'
      ? Math.round((px / this.gridDpi) * 2.54 * 100) / 100
      : px;
  });
  readonly gridGapHDisplay = computed(() => {
    return this.gridUnit() === 'cm'
      ? this.gridGapH()
      : Math.round((this.gridGapH() / 2.54) * this.gridDpi);
  });
  readonly gridGapVDisplay = computed(() => {
    return this.gridUnit() === 'cm'
      ? this.gridGapV()
      : Math.round((this.gridGapV() / 2.54) * this.gridDpi);
  });
  private gridDpi = 300;
  readonly result = signal<{ success: boolean; message: string } | null>(null);
  private resultTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resultTimer) clearTimeout(this.resultTimer);
    });
  }

  // Projekt ID resolver — komponens állítja be init-kor
  private projectIdResolver: () => number | undefined = () => undefined;

  setProjectIdResolver(fn: () => number | undefined): void {
    this.projectIdResolver = fn;
  }

  // === Panel kezelés ===

  togglePanel(): void { this.panelOpen.update(v => !v); this.gridPanelOpen.set(false); }
  closePanel(): void { this.panelOpen.set(false); }

  toggleGridPanel(): void { this.gridPanelOpen.update(v => !v); this.panelOpen.set(false); }
  closeGridPanel(): void { this.gridPanelOpen.set(false); }

  toggleGridUnit(): void {
    this.gridUnit.update(u => u === 'px' ? 'cm' : 'px');
  }

  /** Grid gap H setter: display értékből cm-be */
  setGridGapHFromDisplay(value: number): void {
    this.gridGapH.set(this.gridUnit() === 'cm' ? value : Math.round((value / this.gridDpi) * 2.54 * 100) / 100);
  }

  /** Grid gap V setter: display értékből cm-be */
  setGridGapVFromDisplay(value: number): void {
    this.gridGapV.set(this.gridUnit() === 'cm' ? value : Math.round((value / this.gridDpi) * 2.54 * 100) / 100);
  }

  /** Az input mezőből érkező érték → gridGapPx-be konvertálva */
  setGridGapFromDisplay(value: number): void {
    if (this.gridUnit() === 'cm') {
      this.gridGapPx.set(Math.round((value / 2.54) * this.gridDpi));
    } else {
      this.gridGapPx.set(value);
    }
  }

  toggleType(action: 'refresh' | 'position', type: 'names' | 'positions'): void {
    if (action === 'refresh') {
      if (type === 'names') this.refreshNames.update(v => !v);
      else this.refreshPositions.update(v => !v);
    } else {
      if (type === 'names') this.positionNames.update(v => !v);
      else this.positionPositions.update(v => !v);
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
      if (c.action === 'link') {
        await this.executeLink(c.target);
      } else if (c.action === 'position-labels') {
        await this.executeArrange(c.target, this.positionNames(), this.positionPositions());
      } else if (c.action === 'refresh-labels') {
        await this.executeRefreshLabels(c.target, this.refreshNames(), this.refreshPositions());
      } else if (c.action === 'sync-positions') {
        await this.executeSyncPositions(c.target);
      } else if (c.action === 'reposition-to-image') {
        await this.executeRepositionToImage();
      } else if (c.action === 'equalize-grid') {
        await this.executeEqualizeGrid();
      } else if (c.action === 'grid-arrange') {
        await this.executeGridArrange();
      }
    } finally {
      this.loading.set(false);
    }
  }

  // === Eredmény megjelenítés ===

  setResult(success: boolean, message: string): void {
    if (this.resultTimer) clearTimeout(this.resultTimer);
    this.ngZone.run(() => this.result.set({ success, message }));
    this.resultTimer = setTimeout(
      () => this.ngZone.run(() => this.result.set(null)),
      OverlayQuickActionsService.RESULT_TIMEOUT_MS,
    );
  }

  showLinkResult(result: JsxResult | null, type: 'link' | 'unlink'): void {
    try {
      if (!result?.output) { this.setResult(false, 'Nincs válasz a Photoshoptól'); return; }
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) { this.setResult(false, 'Érvénytelen válasz'); return; }
      const data: JsxLinkData = JSON.parse(cleaned);
      if (data.error) { this.setResult(false, data.error); return; }
      const count = type === 'link' ? data.linked : data.unlinked;
      const verb = type === 'link' ? 'linkelve' : 'szétlinkelve';
      const nameCount = data.names?.length || 0;
      if (count === 0) { this.setResult(false, 'Nem találtam linkelhető layereket'); return; }
      this.setResult(true, `${count} layer ${verb} (${nameCount} név)`);
    } catch { this.setResult(false, 'Hiba a válasz feldolgozásában'); }
  }

  // === Private: Execute metódusok ===

  private async executeLink(target: string): Promise<void> {
    const layerNames = await this.getLayerNames(target);
    if (layerNames.length === 0) {
      this.setResult(false, `Nincsenek ${this.targetLabel(target, 'image')} layerek`);
      return;
    }
    const result = await this.ps.runJsx(
      'link-layers', 'actions/link-selected.jsx',
      { LAYER_NAMES: layerNames.join('|') },
    );
    this.showLinkResult(result, 'link');
  }

  private async executeArrange(target: string, doNames: boolean, doPositions: boolean): Promise<void> {
    if (!doNames && !doPositions) { this.setResult(false, 'Válassz típust (Nevek és/vagy Pozíciók)'); return; }

    let nameMapJson = '';
    if (doNames) {
      const persons = await this.ensurePersons();
      const layerNames = await this.getLayerNames(target);
      const nameMap = this.buildNameMap(layerNames, persons);
      nameMapJson = JSON.stringify(nameMap);
    }

    const result = await this.ps.runJsx('arrange-names', 'actions/arrange-names-selected.jsx', {
      TEXT_ALIGN: 'center',
      BREAK_AFTER: String(this.settings.nameBreakAfter()),
      NAME_GAP_CM: String(this.settings.nameGapCm()),
      TARGET_GROUP: this.targetGroup(target),
      SKIP_NAMES: doNames ? 'false' : 'true',
      SKIP_POSITIONS: doPositions ? 'false' : 'true',
      NAME_MAP: nameMapJson,
    });

    const label = this.targetLabel(target);
    const typeLabel = doNames && doPositions ? 'név+pozíció' : doNames ? 'név' : 'pozíció';
    this.handleJsxResult(result,
      data => `${data['arranged']} ${typeLabel} rendezve (${label})`,
      `Rendezés kész (${label})`,
    );
  }

  private async executeRefreshLabels(target: string, doNames: boolean, doPositions: boolean): Promise<void> {
    if (!doNames && !doPositions) { this.setResult(false, 'Válassz típust (Nevek és/vagy Pozíciók)'); return; }

    // Ha pozíciók is kellenek → az arrange script csinálja
    if (doPositions) {
      await this.executeArrange(target, doNames, doPositions);
      return;
    }

    // MINDIG friss adatot kérünk a DB-ből (ne a cache-ből)
    const persons = await this.forceRefreshPersons();
    if (persons.length === 0) { this.setResult(false, 'Nincsenek személyek betöltve'); return; }

    const layerNames = await this.getLayerNames(target);
    const nameMap = this.buildNameMap(layerNames, persons);
    if (Object.keys(nameMap).length === 0) { this.setResult(false, 'Nem találtam párosítható neveket'); return; }

    const result = await this.ps.runJsx('refresh-names', 'actions/refresh-name-texts.jsx', {
      NAME_MAP: JSON.stringify(nameMap),
      TARGET_GROUP: this.targetGroup(target),
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
    if (persons.length === 0) { this.setResult(false, 'Nincsenek személyek betöltve'); return; }

    const layerNames = await this.getLayerNames(target);
    if (layerNames.length === 0) {
      this.setResult(false, `Nincsenek ${this.targetLabel(target, 'image')} layerek`);
      return;
    }

    // Slug→person matching
    const matches = this.matchLayerToPersons(layerNames, persons);
    const personsData = Array.from(matches.entries()).map(([ln, person]) => ({
      layerName: ln,
      displayText: person.name,
      position: person.title || null,
      group: person.type === 'teacher' ? 'Teachers' : 'Students',
    }));

    if (personsData.length === 0) {
      this.setResult(false, `Nem találtam párosítható személyeket (${persons.length} személy, ${layerNames.length} layer)`);
      return;
    }

    const result = await this.ps.runJsx('sync-positions', 'actions/update-positions.jsx', {
      persons: personsData,
      nameBreakAfter: this.settings.nameBreakAfter(),
      textAlign: 'center',
      nameGapCm: this.settings.nameGapCm(),
      positionGapCm: 0.15,
      positionFontSize: 18,
    });

    const label = this.targetLabel(target);
    try {
      if (result?.output) {
        const lines = result.output.trim().split('\n');
        this.setResult(true, `Pozíciók frissítve (${label}): ${lines[lines.length - 1]}`);
      } else {
        this.setResult(true, `Pozíciók frissítve (${label})`);
      }
    } catch { this.setResult(true, `Pozíciók frissítve (${label})`); }
  }

  private async executeRepositionToImage(): Promise<void> {
    const result = await this.ps.runJsx(
      'reposition-to-image', 'actions/reposition-to-image.jsx', {},
    );

    this.handleJsxResult(result,
      data => `${data['moved']} layer visszahelyezve`,
      'Visszahelyezés kész',
    );
  }

  // === Grid egyenletes elosztás ===

  async alignTopOnly(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.ps.runJsx(
        'equalize-grid', 'actions/equalize-grid-selected.jsx',
        { ALIGN_TOP_ONLY: 'true' },
      );
      this.handleJsxResult(result,
        data => `${data['aligned']} kép egy szintre igazítva`,
        'Felső él igazítás kész',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async measureGridGaps(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.ps.runJsx(
        'equalize-grid', 'actions/equalize-grid-selected.jsx', {},
      );
      try {
        if (result?.output) {
          const data: Record<string, unknown> = JSON.parse(result.output.trim());
          if (data['error']) { this.setResult(false, String(data['error'])); return; }
          if (data['mode'] === 'measure') {
            this.ngZone.run(() => {
              if (typeof data['dpi'] === 'number') this.gridDpi = data['dpi'] as number;
              this.gridGapPx.set(data['avgGapPx'] as number);
              this.gridLayerCount.set(data['count'] as number);
            });
            this.setResult(true, `${data['count']} kép, átlag gap: ${data['avgGapPx']} px`);
          }
        } else {
          this.setResult(false, 'Nincs válasz a Photoshoptól');
        }
      } catch { this.setResult(false, 'Hiba a válasz feldolgozásában'); }
    } finally {
      this.loading.set(false);
    }
  }

  private async executeEqualizeGrid(): Promise<void> {
    const gap = this.gridGapPx();
    if (gap === null) { this.setResult(false, 'Előbb mérd meg a térközt'); return; }

    const result = await this.ps.runJsx(
      'equalize-grid', 'actions/equalize-grid-selected.jsx', {
        GAP_H_PX: String(gap),
        ALIGN_TOP: this.gridAlignTop() ? 'true' : 'false',
      },
    );

    this.handleJsxResult(result,
      data => `${data['moved']} kép elosztva`,
      'Elosztás kész',
    );
  }

  // === Grid rácsba rendezés ===

  private async executeGridArrange(): Promise<void> {
    const cols = this.gridCols();
    if (cols < 1) { this.setResult(false, 'Az oszlopszám legalább 1 legyen'); return; }

    // DPI lekérés a dokumentumból (mérés nélkül is pontos legyen)
    await this.fetchDocDpi();
    const dpi = this.gridDpi || 300;
    const cmToPx = (cm: number) => Math.round((cm / 2.54) * dpi);

    const rows = this.gridRows();
    const result = await this.ps.runJsx(
      'equalize-grid', 'actions/equalize-grid-selected.jsx', {
        GRID_COLS: String(cols),
        GRID_ROWS: rows > 0 ? String(rows) : '',
        GRID_GAP_H_PX: String(cmToPx(this.gridGapH())),
        GRID_GAP_V_PX: String(cmToPx(this.gridGapV())),
        GRID_ALIGN: this.gridAlign(),
      },
    );

    this.handleJsxResult(result,
      data => `${data['placed']} kép rácsba rendezve (${data['cols']}×${data['rows']})`,
      'Rácsba rendezés kész',
    );
  }

  // === Középre igazítás ===

  async executeCenterSelected(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.ps.runJsx(
        'center-selected', 'actions/center-selected.jsx', {},
      );
      this.handleJsxResult(result,
        data => {
          if (data['dx'] === 0) return String(data['message']) || 'Már középen van';
          return `${data['count']} kép középre igazítva (${data['dx']}px)`;
        },
        'Középre igazítás kész',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Dokumentum DPI lekérése mérés futtatásával */
  private async fetchDocDpi(): Promise<void> {
    try {
      const result = await this.ps.runJsx(
        'equalize-grid', 'actions/equalize-grid-selected.jsx', {},
      );
      if (result?.output) {
        const data: Record<string, unknown> = JSON.parse(result.output.trim());
        if (typeof data['dpi'] === 'number') this.gridDpi = data['dpi'] as number;
      }
    } catch { /* DPI marad az előző érték */ }
  }

  // === Private: Közös helperek ===

  /** Persons lazy-load: signal-ból vagy API-ból */
  private async ensurePersons(): Promise<PersonItem[]> {
    let persons = this.projectService.persons();
    if (persons.length === 0) {
      const pid = this.projectService.getLastProjectId() || this.projectIdResolver();
      if (pid) persons = await this.projectService.fetchPersons(pid);
    }
    return persons;
  }

  /** Persons MINDIG frissítés DB-ből (feliratok frissítéséhez kell a legfrissebb adat) */
  private async forceRefreshPersons(): Promise<PersonItem[]> {
    const pid = this.projectService.getLastProjectId() || this.projectIdResolver();
    if (pid) return await this.projectService.fetchPersons(pid);
    return this.projectService.persons();
  }

  /** PS Image layer nevek target alapján */
  private async getLayerNames(target: string): Promise<string[]> {
    const data = await this.ps.getImageLayerData();
    if (target === 'teachers') return data.teachers;
    if (target === 'students') return data.students;
    return data.names;
  }

  /** Target → magyar label */
  private targetLabel(target: string, fallback = 'összes'): string {
    if (target === 'teachers') return 'tanár';
    if (target === 'students') return 'diák';
    return fallback;
  }

  /** Target → JSX TARGET_GROUP érték */
  private targetGroup(target: string): string {
    return target === 'teachers' || target === 'students' ? target : 'all';
  }

  /** Layer név → Person matching: ID-elő, slug-fallback */
  private matchLayerToPersons(layerNames: string[], persons: PersonItem[]): Map<string, PersonItem> {
    const result = new Map<string, PersonItem>();
    const personById = new Map(persons.map(p => [p.id, p]));
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const personByNorm = new Map(persons.map(p => [normalize(p.name), p]));

    for (const ln of layerNames) {
      // 1. ID-alapú matching
      const sepIdx = ln.indexOf('---');
      if (sepIdx !== -1) {
        const pid = parseInt(ln.substring(sepIdx + 3), 10);
        if (pid > 0 && personById.has(pid)) {
          result.set(ln, personById.get(pid)!);
          continue;
        }
      }
      // 2. Slug→humanName fallback
      const humanName = this.sortService.slugToHumanName(ln);
      const person = personByNorm.get(normalize(humanName));
      if (person) result.set(ln, person);
    }
    return result;
  }

  /** NAME_MAP építés: layer név → person.name (ID-elő + slug-fallback) */
  private buildNameMap(layerNames: string[], persons: PersonItem[]): Record<string, string> {
    const matches = this.matchLayerToPersons(layerNames, persons);
    const nameMap: Record<string, string> = {};
    for (const [layerName, person] of matches) {
      nameMap[layerName] = person.name;
    }
    return nameMap;
  }

  /** JSX eredmeny feldolgozas egyseres mintaval */
  private handleJsxResult(
    result: JsxResult | null,
    formatSuccess: (data: Record<string, unknown>) => string,
    fallbackMessage: string,
  ): void {
    try {
      if (result?.output) {
        const data: Record<string, unknown> = JSON.parse(result.output.trim());
        if (data['error']) { this.setResult(false, String(data['error'])); return; }
        this.setResult(true, formatSuccess(data));
      } else {
        this.setResult(true, fallbackMessage);
      }
    } catch { this.setResult(true, fallbackMessage); }
  }
}

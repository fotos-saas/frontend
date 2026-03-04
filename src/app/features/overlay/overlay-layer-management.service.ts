import { Injectable, inject, NgZone, signal } from '@angular/core';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayContext } from '../../core/services/electron.types';

/**
 * Layer átnevezés (rename IDs) + névsor frissítés (refresh roster).
 */
@Injectable()
export class OverlayLayerManagementService {
  private readonly ngZone = inject(NgZone);
  private readonly project = inject(OverlayProjectService);
  private readonly ps = inject(OverlayPhotoshopService);

  // Rename dialog state
  readonly renameDialogOpen = signal(false);
  readonly renameMatched = signal<Array<{ old: string; new: string; personName: string }>>([]);
  readonly renameUnmatched = signal<Array<{ layerName: string; newId: string }>>([]);
  readonly renameApplying = signal(false);

  // Refresh roster dialog state
  readonly refreshRosterDialogOpen = signal(false);
  readonly refreshRosterToRemove = signal<Array<{ name: string; layerName: string }>>([]);
  readonly refreshRosterToAdd = signal<Array<{ name: string; type: string; layerName: string; displayText: string; group: string }>>([]);
  readonly refreshRosterApplying = signal(false);

  // ============ Rename Layer IDs ============

  /** Layer ID frissítés indítása — busy state + doRenameLayerIds */
  async renameLayerIds(context: OverlayContext): Promise<void> {
    await this.ps.withBusy('rename-layer-ids', () => this.doRenameLayerIds(context));
  }

  private async doRenameLayerIds(context: OverlayContext): Promise<void> {
    const allNames = await this.ps.getImageLayerNames();
    if (allNames.length === 0) return;

    // Persons betöltése
    const pid = await this.project.resolveProjectId(context);
    let personList: PersonItem[] = [];
    if (pid) {
      personList = await this.project.fetchPersons(pid);
    }

    // Matching: slug → person (exact → startsWith → fuzzy fallback)
    const matched: Array<{ old: string; new: string; personName: string }> = [];
    const unmatched: Array<{ layerName: string; newId: string }> = [];
    const usedPersonIds = new Set<number>();

    for (const layerName of allNames) {
      const slug = layerName.replace(/---\d+$/, '');
      const normalizedSlug = this.normalize(slug);

      const available = personList.filter(p => !usedPersonIds.has(p.id));
      const person =
        available.find(p => this.normalize(p.name) === normalizedSlug) ||
        available.find(p => this.normalize(p.name).startsWith(normalizedSlug + ' ')) ||
        available.find(p => normalizedSlug.startsWith(this.normalize(p.name) + ' ')) ||
        available.find(p => this.levenshtein(this.normalize(p.name), normalizedSlug) <= 2);

      if (person) {
        usedPersonIds.add(person.id);
        const personSlug = this.toLayerSlug(person.name);
        const newName = `${personSlug}---${person.id}`;
        if (newName !== layerName) {
          matched.push({ old: layerName, new: newName, personName: person.name });
        }
      } else {
        unmatched.push({ layerName, newId: '' });
      }
    }

    // Fallback: Names text content alapján matchelés
    if (unmatched.length > 0 && personList.length > 0) {
      const namesTextMap = await this.ps.getNamesTextContent();
      if (namesTextMap.size > 0) {
        const stillUnmatched: typeof unmatched = [];
        for (const um of unmatched) {
          const textContent = namesTextMap.get(um.layerName);
          if (!textContent) { stillUnmatched.push(um); continue; }
          const normalizedText = this.normalize(textContent);
          const available = personList.filter(p => !usedPersonIds.has(p.id));
          const person =
            available.find(p => this.normalize(p.name) === normalizedText) ||
            available.find(p => this.levenshtein(this.normalize(p.name), normalizedText) <= 2);
          if (person) {
            usedPersonIds.add(person.id);
            const personSlug = this.toLayerSlug(person.name);
            const newName = `${personSlug}---${person.id}`;
            if (newName !== um.layerName) {
              matched.push({ old: um.layerName, new: newName, personName: person.name });
            }
          } else {
            stillUnmatched.push(um);
          }
        }
        unmatched.length = 0;
        unmatched.push(...stillUnmatched);
        console.log('[RENAME] Names fallback matched:', matched.length, 'still unmatched:', unmatched.length);
      }
    }

    // Ha nincs nem matchelt ÉS van átnevezhető → azonnal futtatjuk
    if (unmatched.length === 0 && matched.length > 0) {
      await this.executeRename(matched.map(m => ({ old: m.old, new: m.new })));
      return;
    }

    // Ha nincs átnevezhető sem → nincs teendő
    if (unmatched.length === 0 && matched.length === 0) return;

    // Dialógus megnyitása
    this.ngZone.run(() => {
      this.renameMatched.set(matched);
      this.renameUnmatched.set(unmatched);
      this.renameDialogOpen.set(true);
    });
  }

  /** Rename dialógus: kézi ID módosítás */
  updateUnmatchedId(index: number, newId: string): void {
    this.renameUnmatched.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], newId };
      return copy;
    });
  }

  /** Rename dialógus: "Alkalmazás" gomb */
  async applyRename(): Promise<void> {
    this.renameApplying.set(true);
    try {
      const renameMap: Array<{ old: string; new: string }> = [];

      for (const m of this.renameMatched()) {
        renameMap.push({ old: m.old, new: m.new });
      }
      for (const u of this.renameUnmatched()) {
        const id = u.newId.trim();
        if (id) {
          const slug = u.layerName.replace(/---\d+$/, '');
          renameMap.push({ old: u.layerName, new: `${slug}---${id}` });
        }
      }

      if (renameMap.length > 0) {
        await this.executeRename(renameMap);
      }
      this.renameDialogOpen.set(false);
    } finally {
      this.renameApplying.set(false);
    }
  }

  closeRenameDialog(): void {
    this.renameDialogOpen.set(false);
  }

  // ============ Refresh Roster ============

  /** Névsor frissítés indítása — busy state + doRefreshRoster */
  async refreshRoster(context: OverlayContext): Promise<void> {
    await this.ps.withBusy('refresh-roster', () => this.doRefreshRoster(context));
  }

  private async doRefreshRoster(context: OverlayContext): Promise<void> {
    const allNames = await this.ps.getImageLayerNames();
    if (allNames.length === 0) {
      console.log('[REFRESH-ROSTER] Nincs PSD layer');
      return;
    }

    const pid = await this.project.resolveProjectId(context);
    if (!pid) {
      console.error('[REFRESH-ROSTER] Nincs projectId');
      return;
    }

    const personList = await this.project.fetchPersons(pid);

    // Diff számítás
    const layerPersonIds = new Set<number>();
    const layerNameById = new Map<number, string>();
    for (const name of allNames) {
      const match = name.match(/---(\d+)$/);
      if (match) {
        const id = parseInt(match[1], 10);
        layerPersonIds.add(id);
        layerNameById.set(id, name);
      }
    }

    const dbPersonIds = new Set(personList.map(p => p.id));

    // Törlendő: PSD-ben van, DB-ben nincs
    const toRemove: Array<{ name: string; layerName: string }> = [];
    for (const [id, layerName] of layerNameById) {
      if (!dbPersonIds.has(id)) {
        const slug = layerName.replace(/---\d+$/, '').replace(/-/g, ' ');
        toRemove.push({ name: slug, layerName });
      }
    }

    // Hozzáadandó: DB-ben van, PSD-ben nincs
    const toAdd: Array<{ name: string; type: string; layerName: string; displayText: string; group: string }> = [];
    for (const person of personList) {
      if (!layerPersonIds.has(person.id)) {
        const slug = person.name
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .toLowerCase().replace(/\s+/g, '-');
        toAdd.push({
          name: person.name,
          type: person.type,
          layerName: `${slug}---${person.id}`,
          displayText: person.name,
          group: person.type === 'teacher' ? 'Teachers' : 'Students',
        });
      }
    }

    if (toRemove.length === 0 && toAdd.length === 0) {
      console.log('[REFRESH-ROSTER] Nincs eltérés');
      return;
    }

    this.ngZone.run(() => {
      this.refreshRosterToRemove.set(toRemove);
      this.refreshRosterToAdd.set(toAdd);
      this.refreshRosterDialogOpen.set(true);
    });
  }

  async applyRefreshRoster(): Promise<void> {
    this.refreshRosterApplying.set(true);
    try {
      const toRemove = this.refreshRosterToRemove().map(r => r.layerName);
      const toAdd = this.refreshRosterToAdd().map(a => ({
        layerName: a.layerName,
        displayText: a.displayText,
        group: a.group,
      }));

      await this.ps.runJsx('refresh-roster', 'actions/refresh-roster.jsx', {
        toRemove,
        toAdd,
      });

      this.ngZone.run(() => {
        this.refreshRosterDialogOpen.set(false);
        this.refreshRosterToRemove.set([]);
        this.refreshRosterToAdd.set([]);
      });
    } catch (e) {
      console.error('[REFRESH-ROSTER] apply error:', e);
    } finally {
      this.ngZone.run(() => this.refreshRosterApplying.set(false));
    }
  }

  closeRefreshRosterDialog(): void {
    if (this.refreshRosterApplying()) return;
    this.refreshRosterDialogOpen.set(false);
    this.refreshRosterToRemove.set([]);
    this.refreshRosterToAdd.set([]);
  }

  // ============ Helpers ============

  private async executeRename(renameMap: Array<{ old: string; new: string }>): Promise<void> {
    const result = await window.electronAPI?.photoshop.runJsx({
      scriptName: 'actions/rename-layers.jsx',
      jsonData: { renameMap },
    });
    console.log('[RENAME] result:', result);
  }

  /** DB person névből layer slug: ékezet eltávolítás + lowercase + alulvonás szeparátor */
  private toLayerSlug(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[._\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 3;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }
}

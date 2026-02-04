import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuItem } from '../models/menu-item.model';
import { ProjectModeService, ProjectModeInfo } from '../../services/project-mode.service';
import { AuthService } from '../../services/auth.service';
import { PhotoSelectionBadgeService } from '../../services/photo-selection-badge.service';

/**
 * Menu Config Service
 *
 * Központi menü konfiguráció kezelése.
 * A menüelemek láthatósága a projekt állapotától függ.
 *
 * Menü struktúra (a terv alapján):
 * - Kezdőlap (home)
 * - Tabló szekció (minták, minta választó, hiányzók, szavazások)
 * - Rendelés szekció (adatok, véglegesítés)
 * - Hírfolyam
 * - Beszélgetések
 * - Beállítások (bottom)
 */
@Injectable({
  providedIn: 'root'
})
export class MenuConfigService {
  private readonly projectModeService = inject(ProjectModeService);
  private readonly authService = inject(AuthService);
  private readonly photoSelectionBadge = inject(PhotoSelectionBadgeService);

  /**
   * Projekt adatok signal-ként (toSignal az Observable-ből)
   */
  private readonly projectSignal = toSignal(this.authService.project$, { initialValue: null });

  /**
   * canFinalize signal (toSignal az Observable-ből)
   */
  private readonly canFinalizeSignal = toSignal(this.authService.canFinalize$, { initialValue: false });

  /**
   * Projekt info computed - konvertálja a projekt adatokat ProjectModeInfo formátumra
   */
  private readonly projectInfo = computed<ProjectModeInfo | null>(() => {
    const project = this.projectSignal();
    if (!project) return null;

    return {
      samplesCount: project.samplesCount,
      hasOrderData: project.hasOrderData,
      hasTemplateChooser: project.hasTemplateChooser,
      hasMissingPersons: project.hasMissingPersons,
      selectedTemplatesCount: project.selectedTemplatesCount,
      activePollsCount: project.activePollsCount,
      hasPhotoSelection: project.hasPhotoSelection,
    };
  });

  /**
   * canFinalize computed wrapper
   */
  private readonly canFinalize = computed(() => this.canFinalizeSignal());

  /**
   * Fő menüelemek (top position)
   */
  readonly menuItems = computed<MenuItem[]>(() => {
    const project = this.projectInfo();
    const canFinalizeValue = this.canFinalize();

    return [
      {
        id: 'home',
        label: 'Kezdőlap',
        icon: 'home',
        route: '/home',
      },
      {
        id: 'tablo',
        label: 'Tabló',
        icon: 'image',
        children: this.getTabloChildren(project, canFinalizeValue),
      },
      // Megrendelési adatok - közvetlen link, nem lenyíló menü
      ...(this.projectModeService.showOrderData(project) ? [{
        id: 'order-data',
        label: 'Megrendelés',
        icon: 'shopping-cart',
        route: '/order-data',
      }] : []),
      {
        id: 'newsfeed',
        label: 'Hírek',
        icon: 'newspaper',
        route: '/newsfeed',
      },
      {
        id: 'forum',
        label: 'Beszélgetések',
        icon: 'message-circle',
        route: '/forum',
      },
      {
        id: 'notifications',
        label: 'Értesítések',
        icon: 'bell',
        route: '/notifications',
      },
    ].filter(item => this.isItemVisible(item, project, canFinalizeValue));
  });

  /**
   * Alsó menüelemek (bottom position)
   */
  readonly bottomMenuItems = computed<MenuItem[]>(() => []);

  /**
   * Összes menüelem (flat list a kereséshez)
   */
  readonly flatMenuItems = computed(() => {
    const flatten = (items: MenuItem[]): MenuItem[] => {
      return items.flatMap(item =>
        item.children ? [item, ...flatten(item.children)] : [item]
      );
    };
    return flatten([...this.menuItems(), ...this.bottomMenuItems()]);
  });

  /**
   * Szülő elem keresése route alapján
   */
  findParentByRoute(route: string): MenuItem | null {
    for (const item of this.menuItems()) {
      if (item.children) {
        const child = item.children.find(c => c.route === route);
        if (child) return item;
      }
    }
    return null;
  }

  /**
   * Menüelem keresése route alapján
   */
  findItemByRoute(route: string): MenuItem | null {
    return this.flatMenuItems().find(item => item.route === route) ?? null;
  }

  // ============ Private Methods ============

  /**
   * Tabló szekció gyermekeinek generálása
   */
  private getTabloChildren(project: ProjectModeInfo | null, canFinalizeValue: boolean): MenuItem[] {
    const children: MenuItem[] = [];

    // Minták (csak ha van samplesCount > 0)
    if (this.projectModeService.showSamples(project)) {
      children.push({
        id: 'samples',
        label: 'Minták',
        route: '/samples',
      });
    }

    // Minta választó (rendelés előtt, ha hasTemplateChooser és nincs kiválasztott)
    if (this.projectModeService.showTemplateChooser(project)) {
      children.push({
        id: 'template-chooser',
        label: 'Minta választó',
        route: '/template-chooser',
      });
    }

    // Hiányzók (rendelés előtt, ha hasMissingPersons és VAN kiválasztott minta)
    if (this.projectModeService.showMissingPersons(project)) {
      children.push({
        id: 'missing',
        label: 'Hiányzók',
        route: '/missing-persons',
      });
    }

    // Szavazások (ha van aktív szavazás)
    if (this.projectModeService.showVoting(project)) {
      children.push({
        id: 'voting',
        label: 'Szavazások',
        route: '/voting',
      });
    }

    // Bökés / Hiányzók nyomozása (mindig látható)
    children.push({
      id: 'poke',
      label: '👉 bökj',
      route: '/poke',
    });

    // Képválasztás (vendégeknek - share token, ha hasPhotoSelection=true)
    if (this.showPhotoSelection(project)) {
      children.push({
        id: 'photo-selection',
        label: 'Képválasztás',
        route: '/photo-selection',
        badge: this.photoSelectionBadge.badgeText() ?? undefined,
      });
    }

    // Véglegesítés (rendelés előtt és canFinalize)
    if (this.projectModeService.canShowFinalization(project) && canFinalizeValue) {
      children.push({
        id: 'finalization',
        label: 'Véglegesítés',
        route: '/order-finalization',
      });
    }

    return children;
  }

  /**
   * Menüelem látható-e?
   * Szekciók elrejtése, ha nincs látható gyermek
   */
  private isItemVisible(item: MenuItem, project: ProjectModeInfo | null, canFinalizeValue: boolean): boolean {
    // Ha van children, csak akkor látható, ha van legalább 1 látható gyermek
    if (item.children !== undefined) {
      return item.children !== null && item.children.length > 0;
    }

    // Egyszerű menüelemek mindig láthatók
    return true;
  }

  /**
   * Képválasztás menüpont látható-e?
   * Csak ha a projekt engedélyezte a tablo workflow-t (hasPhotoSelection=true)
   */
  private showPhotoSelection(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    return !!project.hasPhotoSelection;
  }
}

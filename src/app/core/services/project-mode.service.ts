import { Injectable } from '@angular/core';
import { TabloProject } from './auth.service';

/**
 * Navbar projekt info interface (részleges projekt adat)
 */
export interface ProjectModeInfo {
  samplesCount?: number;
  hasOrderData?: boolean;
  hasTemplateChooser?: boolean;
  hasMissingPersons?: boolean;
  selectedTemplatesCount?: number;
  /** Aktív szavazások száma (ha > 0, megjelenik a Szavazások menüpont) */
  activePollsCount?: number;
  /** Képválasztás elérhető-e (tablo workflow enabled) */
  hasPhotoSelection?: boolean;
  /** Fizetős módosítás aktív-e */
  billingEnabled?: boolean;
}

/**
 * Project Mode Service
 *
 * Központi szolgáltatás a projekt módok kezeléséhez.
 * Meghatározza, hogy egy projekt "rendelés előtt" vagy "rendelés után" módban van-e,
 * és ez alapján mely menüpontok/kártyák láthatóak.
 *
 * === PROJEKT MÓDOK ===
 *
 * 1. RENDELÉS ELŐTT (orderingMode): samplesCount === 0 ÉS hasOrderData === false
 *    - Minta Választó látszik (ha hasTemplateChooser=true és nincs kiválasztott minta)
 *    - Véglegesítés látszik (ha canFinalize)
 *    - Hiányzó képek látszik (ha hasMissingPersons=true és VAN kiválasztott minta)
 *
 * 2. RENDELÉS UTÁN (orderedMode): samplesCount > 0 VAGY hasOrderData === true
 *    - Minták menü látszik (ha samplesCount > 0)
 *    - Megrendelés menü látszik
 *    - Minta Választó NEM látszik
 *    - Véglegesítés NEM látszik
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectModeService {

  /**
   * Rendelés előtti mód-e?
   * True, ha még nem adott le megrendelést (nincs minta ÉS nincs megrendelés adat)
   */
  isOrderingMode(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    const hasSamples = (project.samplesCount ?? 0) > 0;
    const hasOrder = !!project.hasOrderData;
    return !hasSamples && !hasOrder;
  }

  /**
   * Rendelés utáni mód-e?
   * True, ha már leadott megrendelés van (van minta VAGY van megrendelés adat)
   */
  isOrderedMode(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    return !this.isOrderingMode(project);
  }

  /**
   * Minták menüpont/kártya látható-e?
   * Csak ha van leadott megrendelés és van minta (samplesCount > 0)
   */
  showSamples(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    return (project.samplesCount ?? 0) > 0;
  }

  /**
   * Megrendelési adatok menüpont/kártya látható-e?
   * Csak RENDELÉS UTÁN mód esetén
   */
  showOrderData(project: ProjectModeInfo | null): boolean {
    return this.isOrderedMode(project);
  }

  /**
   * Minta Választó menüpont/kártya látható-e?
   * Csak RENDELÉS ELŐTT mód esetén ÉS hasTemplateChooser=true ÉS még nincs kiválasztott minta
   */
  showTemplateChooser(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    if (!this.isOrderingMode(project)) return false;
    return !!(project.hasTemplateChooser && (project.selectedTemplatesCount ?? 0) === 0);
  }

  /**
   * Hiányzó képek menüpont/kártya látható-e?
   * Csak RENDELÉS ELŐTT mód esetén ÉS hasMissingPersons=true ÉS már VAN kiválasztott minta
   */
  showMissingPersons(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    if (!this.isOrderingMode(project)) return false;
    return !!(project.hasMissingPersons && (project.selectedTemplatesCount ?? 0) > 0);
  }

  /**
   * Véglegesítés menüpont látható-e?
   * Csak RENDELÉS ELŐTT mód esetén (canFinalize külön ellenőrzés!)
   */
  canShowFinalization(project: ProjectModeInfo | null): boolean {
    return this.isOrderingMode(project);
  }

  /**
   * Szavazások menüpont látható-e?
   * Ha van legalább 1 aktív szavazás
   */
  showVoting(project: ProjectModeInfo | null): boolean {
    if (!project) return false;
    return (project.activePollsCount ?? 0) > 0;
  }
}

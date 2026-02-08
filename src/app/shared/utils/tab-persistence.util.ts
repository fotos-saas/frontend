import { WritableSignal } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Tab állapot megőrzése URL fragment-ben (#tab-name).
 *
 * Használat:
 * ```ts
 * private readonly location = inject(Location);
 * readonly activeTab = signal<MyTab>('overview');
 *
 * ngOnInit(): void {
 *   initTabFromFragment(this.activeTab, this.location, ['overview', 'users', 'settings'], 'overview');
 * }
 *
 * onTabChange(tab: MyTab): void {
 *   setTabFragment(this.activeTab, this.location, tab, 'overview');
 * }
 * ```
 */

/**
 * Beolvassa az URL fragment-ből az aktív tab-ot és beállítja a signal-t.
 * Ha az alapértelmezett tab van kiválasztva, a fragment üres marad.
 */
export function initTabFromFragment<T extends string>(
  tabSignal: WritableSignal<T>,
  location: Location,
  validTabs: readonly T[],
  defaultTab: T,
): void {
  const fullPath = location.path(true);
  const hashIndex = fullPath.indexOf('#');
  const fragment = hashIndex >= 0 ? fullPath.substring(hashIndex + 1) : '';
  if (fragment && validTabs.includes(fragment as T)) {
    tabSignal.set(fragment as T);
  }
}

/**
 * Tab váltáskor beállítja a signal-t és frissíti az URL fragment-et.
 * Az alapértelmezett tab-nál a fragment eltávolításra kerül (tiszta URL).
 */
export function setTabFragment<T extends string>(
  tabSignal: WritableSignal<T>,
  location: Location,
  tab: T,
  defaultTab: T,
): void {
  tabSignal.set(tab);

  const fullPath = location.path(true);
  const hashIndex = fullPath.indexOf('#');
  const basePath = hashIndex >= 0 ? fullPath.substring(0, hashIndex) : fullPath;

  if (tab === defaultTab) {
    location.replaceState(basePath);
  } else {
    location.replaceState(basePath + '#' + tab);
  }
}

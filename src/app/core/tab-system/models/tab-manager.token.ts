import { InjectionToken } from '@angular/core';

/**
 * InjectionToken a TabManagerService lazy eleresere.
 *
 * A TabRouteReuseStrategy NEM importalhatja kozvetlenul a TabManagerService-t,
 * mert az circular dependency-t okoz (Router -> Strategy -> TabManager -> Router).
 * Ez a token lehetove teszi, hogy a Strategy az Injector.get()-tel erje el.
 */
export const TAB_MANAGER_TOKEN = new InjectionToken<any>('TAB_MANAGER_TOKEN');

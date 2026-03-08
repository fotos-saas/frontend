// Tab System - public API
export { TabManagerService } from './services/tab-manager.service';
export { TabSessionService } from './services/tab-session.service';
export { TabKeyboardService } from './services/tab-keyboard.service';
export { TabTitleResolver } from './utils/tab-title.resolver';
export { TabRouteReuseStrategy } from './strategies/tab-route-reuse.strategy';
export { TabBarComponent } from './components/tab-bar/tab-bar.component';
export { TabContentHostComponent } from './components/tab-content-host/tab-content-host.component';
export { TabContextMenuComponent } from './components/tab-context-menu/tab-context-menu.component';
export { SplitDividerComponent } from './components/split-divider/split-divider.component';
export { TabLinkDirective } from './directives/tab-link.directive';
export type { Tab, TabSession, SplitMode, CreateTabOptions, TabContextMenuAction } from './models/tab.model';
export { DEFAULT_TAB_URL, MAX_TABS } from './models/tab.model';

import { MenuItem } from '../../core/layout/models/menu-item.model';
import { environment } from '../../../environments/environment';
import { FeatureToggleService } from '../../core/services/feature-toggle.service';

/** Role badge nevek */
export const ROLE_BADGES: Record<string, string> = {
  partner: 'Partner',
  designer: 'Grafikus',
  marketer: 'Marketinges',
  printer: 'Nyomdász',
  assistant: 'Ügyintéző',
};

/**
 * Teljes navigációs menü felépítése a partner shell-hez.
 * A menü a base URL, badge számok és Electron állapot alapján épül fel.
 */
export function buildPartnerMenu(params: {
  baseUrl: string;
  isElectron: boolean;
  inPrintCount: number;
  pendingTaskCount: number;
  pendingApprovalCount: number;
}): MenuItem[] {
  const { baseUrl: base, isElectron, inPrintCount, pendingTaskCount, pendingApprovalCount } = params;

  return [
    { id: 'dashboard', route: `${base}/dashboard`, label: 'Dashboard', icon: 'home' },
    {
      id: 'projects',
      label: 'Projektek',
      icon: 'folder-open',
      children: [
        { id: 'projects-list', route: `${base}/projects`, label: 'Projektek' },
        { id: 'finalizations', route: `${base}/projects/finalizations`, label: 'Véglegesítések', badge: inPrintCount || undefined },
        { id: 'project-tasks', route: `${base}/projects/tasks`, label: 'Tennivalók', badge: pendingTaskCount || undefined },
        { id: 'schools', route: `${base}/projects/schools`, label: 'Iskolák' },
        { id: 'teachers', route: `${base}/projects/teachers`, label: 'Tanárok' },
        { id: 'students', route: `${base}/projects/students`, label: 'Diákok' },
        { id: 'settings', route: `${base}/projects/settings`, label: 'Beállítások' },
        { id: 'tablo-designer', route: `${base}/tablo-designer`, label: 'Tablókészítő', visible: () => isElectron },
      ]
    },
    { id: 'contacts', route: `${base}/contacts`, label: 'Kapcsolatok', icon: 'users' },
    {
      id: 'email-hub',
      label: 'Email Hub',
      icon: 'brain',
      devBadge: true,
      children: [
        { id: 'email-hub-dashboard', route: `${base}/email-hub/dashboard`, label: 'Áttekintés', devBadge: true },
        { id: 'email-hub-drafts', route: `${base}/email-hub/drafts`, label: 'Draft válaszok', devBadge: true },
        { id: 'email-hub-modifications', route: `${base}/email-hub/modifications`, label: 'Módosítási körök', devBadge: true },
        { id: 'email-hub-voice', route: `${base}/email-hub/voice-profile`, label: 'Hangprofil', devBadge: true },
        { id: 'email-hub-costs', route: `${base}/email-hub/ai-costs`, label: 'AI Költségek', devBadge: true },
      ]
    },
    { id: 'quotes', route: `${base}/quotes`, label: 'Árajánlatok', icon: 'file-text', devBadge: true },
    {
      id: 'booking',
      label: 'Naptar',
      icon: 'calendar',
      devBadge: true,
      children: [
        { id: 'booking-calendar', route: `${base}/booking/calendar`, label: 'Naptar', devBadge: true },
        { id: 'booking-list', route: `${base}/booking/bookings`, label: 'Foglalasok', devBadge: true },
        { id: 'booking-types', route: `${base}/booking/session-types`, label: 'Fotozasi tipusok', devBadge: true },
        { id: 'booking-availability', route: `${base}/booking/availability`, label: 'Elerhetoseg', devBadge: true },
        { id: 'booking-import', route: `${base}/booking/batch-import`, label: 'CSV Import', devBadge: true },
        { id: 'booking-page', route: `${base}/booking/page-settings`, label: 'Foglalasi oldal', devBadge: true },
        { id: 'booking-stats', route: `${base}/booking/stats`, label: 'Statisztikak', devBadge: true },
      ]
    },
    {
      id: 'workflows',
      label: 'Előkészítő',
      icon: 'workflow',
      devBadge: true,
      children: [
        { id: 'workflow-list', route: `${base}/workflows`, label: 'Munkafolyamatok', badge: pendingApprovalCount || undefined, devBadge: true },
        { id: 'workflow-settings', route: `${base}/workflows/settings`, label: 'Ütemezés', devBadge: true },
      ]
    },
    { id: 'team', route: `${base}/team`, label: 'Csapatom', icon: 'user-plus' },
    { id: 'orders', route: `${base}/orders/clients`, label: 'Megrendelések', icon: 'shopping-bag', devBadge: true },
    {
      id: 'webshop',
      label: 'Webshop',
      icon: 'store',
      devBadge: true,
      children: [
        { id: 'webshop-settings', route: `${base}/webshop/settings`, label: 'Beállítások', devBadge: true },
        { id: 'webshop-products', route: `${base}/webshop/products`, label: 'Termékek és árak', devBadge: true },
        { id: 'webshop-orders', route: `${base}/webshop/orders`, label: 'Rendelések', devBadge: true },
      ]
    },
    {
      id: 'prepayment',
      label: 'Előlegfizetés',
      icon: 'banknote',
      devBadge: true,
      children: [
        { id: 'prepayment-list', route: `${base}/prepayment`, label: 'Előlegek', devBadge: true },
        { id: 'prepayment-settings', route: `${base}/prepayment/settings`, label: 'Beállítások', devBadge: true },
        { id: 'prepayment-stats', route: `${base}/prepayment/stats`, label: 'Statisztikák', devBadge: true },
      ]
    },
    {
      id: 'customization',
      label: 'Testreszabás',
      icon: 'palette',
      children: [
        { id: 'branding', route: `${base}/customization/branding`, label: 'Márkajelzés' },
        { id: 'email-templates', route: `${base}/customization/email-templates`, label: 'Email sablonok', devBadge: true },
      ]
    },
    {
      id: 'subscription',
      label: 'Előfizetésem',
      icon: 'credit-card',
      children: [
        { id: 'subscription-overview', route: `${base}/subscription/overview`, label: 'Előfizetés' },
        { id: 'subscription-invoices', route: `${base}/subscription/invoices`, label: 'Számlák' },
        { id: 'subscription-addons', route: `${base}/subscription/addons`, label: 'Kiegészítők' },
        { id: 'subscription-marketplace', route: `${base}/subscription/marketplace`, label: 'Marketplace', devBadge: true },
        { id: 'subscription-usage', route: `${base}/subscription/marketplace/usage`, label: 'Használat', devBadge: true },
        { id: 'subscription-pause', route: `${base}/subscription/pause`, label: 'Szüneteltetés', devBadge: true },
        { id: 'subscription-account', route: `${base}/subscription/account`, label: 'Fiók törlése' },
      ]
    },
    { id: 'activity-log', route: `${base}/activity-log`, label: 'Tevékenységnapló', icon: 'scroll-text' },
    {
      id: 'partner-settings',
      label: 'Beállítások',
      icon: 'settings',
      children: [
        { id: 'profile', route: `${base}/profile`, label: 'Fiókom' },
        { id: 'portrait', route: `${base}/settings/portrait`, label: 'Portré háttércsere', visible: () => isElectron },
        { id: 'billing', route: `${base}/settings/billing`, label: 'Számlázás és fizetés', devBadge: true },
        { id: 'email-account', route: `${base}/settings/email-account`, label: 'E-mail fiók' },
      ]
    },
  ];
}

/**
 * Csapattag számára szűrt menü (nincs Csapatom, Testreszabás, Előfizetésem).
 */
export function buildTeamMemberMenu(allItems: MenuItem[], baseUrl: string, isElectron: boolean): MenuItem[] {
  return allItems
    .filter(item => !['team', 'customization', 'subscription', 'partner-settings'].includes(item.id))
    .concat([
      {
        id: 'partner-settings',
        label: 'Beállítások',
        icon: 'settings',
        children: [
          { id: 'profile', route: `${baseUrl}/profile`, label: 'Fiókom' },
          { id: 'portrait', route: `${baseUrl}/settings/portrait`, label: 'Portré háttércsere', visible: () => isElectron },
        ]
      },
      { id: 'account-delete', route: `${baseUrl}/account`, label: 'Fiók törlése', icon: 'user-x' },
    ]);
}

/**
 * Production + visible + featureToggle szűrés alkalmazása.
 */
export function filterMenuItems(items: MenuItem[], featureToggleService: FeatureToggleService): MenuItem[] {
  let result = items;

  // Production-ben devBadge menüpontok elrejtése
  if (environment.production) {
    result = result
      .filter(item => !item.devBadge)
      .map(item => {
        if (item.children) {
          const filtered = item.children.filter(c => !c.devBadge);
          return filtered.length ? { ...item, children: filtered } : null;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  // visible callback szűrés (pl. Electron-only menüpontok)
  result = result
    .filter(item => !item.visible || item.visible())
    .map(item => {
      if (item.children) {
        const filtered = item.children.filter(c => !c.visible || c.visible());
        return filtered.length ? { ...item, children: filtered } : null;
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);

  // disabled_features szűrés (partner-szintű denylist)
  result = result
    .filter(item => featureToggleService.isEnabled(`sidebar.${item.id}`))
    .map(item => {
      if (item.children) {
        const filtered = item.children.filter(c => featureToggleService.isEnabled(`sidebar.${c.id}`));
        return filtered.length ? { ...item, children: filtered } : null;
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);

  return result;
}

import { InjectionToken } from '@angular/core';
import { IDashboardService, StatCardConfig, QuickActionConfig } from './dashboard.types';

/**
 * Dashboard service token
 */
export const DASHBOARD_SERVICE = new InjectionToken<IDashboardService>('DashboardService');

/**
 * Route prefix token (pl. '/marketer' vagy '/partner')
 */
export const DASHBOARD_ROUTE_PREFIX = new InjectionToken<string>('DashboardRoutePrefix');

/**
 * Subtitle szöveg token
 */
export const DASHBOARD_SUBTITLE = new InjectionToken<string>('DashboardSubtitle');

/**
 * Stat kártyák konfigurációja
 */
export const DASHBOARD_STAT_CARDS = new InjectionToken<StatCardConfig[]>('DashboardStatCards');

/**
 * Quick action gombok konfigurációja
 */
export const DASHBOARD_QUICK_ACTIONS = new InjectionToken<QuickActionConfig[]>('DashboardQuickActions');

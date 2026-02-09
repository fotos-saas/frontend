/**
 * Hero Dialog Wrapper típusok
 */

/** Elérhető szín témák */
export type HeroDialogTheme = 'purple' | 'blue' | 'green' | 'red' | 'amber';

/** Elérhető méretek */
export type HeroDialogSize = 'sm' | 'md' | 'lg' | 'xl';

/** Méret → max-width mapping */
export const HERO_DIALOG_SIZES: Record<HeroDialogSize, string> = {
  sm: '24rem',   // 384px
  md: '30rem',   // 480px
  lg: '32rem',   // 512px
  xl: '40rem',   // 640px
};

/** Téma színek */
export interface HeroDialogThemeColors {
  accent: string;
  accentHover: string;
  gradientStart: string;
  gradientEnd: string;
  iconShadow: string;
  focusRing: string;
}

export const HERO_DIALOG_THEMES: Record<HeroDialogTheme, HeroDialogThemeColors> = {
  purple: {
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    gradientStart: '#f5f3ff',
    gradientEnd: '#ede9fe',
    iconShadow: 'rgba(139, 92, 246, 0.4)',
    focusRing: 'rgba(139, 92, 246, 0.15)',
  },
  blue: {
    accent: '#3b82f6',
    accentHover: '#2563eb',
    gradientStart: '#eff6ff',
    gradientEnd: '#dbeafe',
    iconShadow: 'rgba(59, 130, 246, 0.4)',
    focusRing: 'rgba(59, 130, 246, 0.15)',
  },
  green: {
    accent: '#22c55e',
    accentHover: '#16a34a',
    gradientStart: '#f0fdf4',
    gradientEnd: '#dcfce7',
    iconShadow: 'rgba(34, 197, 94, 0.4)',
    focusRing: 'rgba(34, 197, 94, 0.15)',
  },
  red: {
    accent: '#ef4444',
    accentHover: '#dc2626',
    gradientStart: '#fef2f2',
    gradientEnd: '#fee2e2',
    iconShadow: 'rgba(239, 68, 68, 0.4)',
    focusRing: 'rgba(239, 68, 68, 0.15)',
  },
  amber: {
    accent: '#f59e0b',
    accentHover: '#d97706',
    gradientStart: '#fffbeb',
    gradientEnd: '#fef3c7',
    iconShadow: 'rgba(245, 158, 11, 0.4)',
    focusRing: 'rgba(245, 158, 11, 0.15)',
  },
};

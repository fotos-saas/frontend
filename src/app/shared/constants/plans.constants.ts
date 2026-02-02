/**
 * Plans Constants
 *
 * Központi csomag definíciók - Single Source of Truth.
 * FONTOS: Backend oldalon a config/plans.php a megfelelő!
 */

/**
 * Plan típus definíció
 */
export interface PlanDefinition {
  key: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

/**
 * Plan option dropdown-hoz
 */
export interface PlanOption {
  value: string;
  label: string;
}

/**
 * Elérhető csomagok definíciója
 * Szinkronban kell lennie a backend config/plans.php-vel!
 */
export const PLANS: Record<string, PlanDefinition> = {
  alap: {
    key: 'alap',
    name: 'Alap',
    monthlyPrice: 4990,
    yearlyPrice: 49900,
  },
  iskola: {
    key: 'iskola',
    name: 'Iskola',
    monthlyPrice: 9990,
    yearlyPrice: 99900,
  },
  studio: {
    key: 'studio',
    name: 'Stúdió',
    monthlyPrice: 19990,
    yearlyPrice: 199900,
  },
} as const;

/**
 * Plan kulcsok típusa
 */
export type PlanKey = keyof typeof PLANS;

/**
 * Plan opciók szűrő dropdown-hoz (tartalmazza az "Összes" opciót)
 */
export const PLAN_FILTER_OPTIONS: PlanOption[] = [
  { value: '', label: 'Összes csomag' },
  { value: 'alap', label: 'Alap' },
  { value: 'iskola', label: 'Iskola' },
  { value: 'studio', label: 'Stúdió' },
];

/**
 * Plan opciók kiválasztó dropdown-hoz (nincs "Összes" opció)
 */
export const PLAN_SELECT_OPTIONS: PlanOption[] = [
  { value: 'alap', label: 'Alap' },
  { value: 'iskola', label: 'Iskola' },
  { value: 'studio', label: 'Stúdió' },
];

/**
 * Plan név lekérése kulcs alapján
 */
export function getPlanName(planKey: string): string {
  return PLANS[planKey]?.name ?? planKey;
}

/**
 * Plan ár lekérése
 */
export function getPlanPrice(planKey: string, cycle: 'monthly' | 'yearly'): number {
  const plan = PLANS[planKey];
  if (!plan) return 0;
  return cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

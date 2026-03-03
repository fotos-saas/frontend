/** Tanár kategória típus */
export type PersonCategory = 'leadership' | 'classTeacher' | 'regular';

/** Vezetőség kulcsszavak (lowercase) */
const LEADERSHIP_KEYWORDS = [
  'igazgató', 'vezető', 'nővér', 'plébános', 'lelkipásztor',
  'esperes', 'püspök', 'rektor', 'dékán', 'elnök',
  'titkár', 'gondnok', 'házfőnök',
];

/** Osztályfőnök kulcsszavak (lowercase) */
const CLASS_TEACHER_KEYWORDS = [
  'osztályfőnök',
];

/** Kategória prioritás rendezéshez (kisebb = előrébb) */
const CATEGORY_ORDER: Record<PersonCategory, number> = {
  leadership: 0,
  classTeacher: 1,
  regular: 2,
};

/**
 * Meghatározza a tanár kategóriáját a title mező alapján.
 * Leadership ellenőrzés előbb (mert "igazgató" fontosabb mint "osztályfőnök").
 */
export function getPersonCategory(title: string | null | undefined): PersonCategory {
  if (!title) return 'regular';
  const lower = title.toLowerCase();

  if (LEADERSHIP_KEYWORDS.some(kw => lower.includes(kw))) return 'leadership';
  if (CLASS_TEACHER_KEYWORDS.some(kw => lower.includes(kw))) return 'classTeacher';
  return 'regular';
}

/** Kategória rendezési érték */
export function getCategoryOrder(category: PersonCategory): number {
  return CATEGORY_ORDER[category];
}

/**
 * Szövegtranszformációk személynevekhez és pozíciókhoz.
 * A régi fotocms-admin rendszer normalizePosition() logikájából portolva.
 */

export type TextTransformType =
  | 'normalize_position'
  | 'lowercase'
  | 'capitalize_words'
  | 'comma_space'
  | 'trim_start'
  | 'trim_end'
  | 'trim_brackets';

export interface TextTransformOption {
  type: TextTransformType;
  label: string;
  /** true = kell egyéni érték input */
  needsCustomValue: boolean;
  /** Melyik mezőre hat: 'name' | 'title' | 'both' */
  target: 'name' | 'title' | 'both';
}

export const TEXT_TRANSFORMS: TextTransformOption[] = [
  { type: 'normalize_position', label: 'Pozíciók normalizálása', needsCustomValue: false, target: 'title' },
  { type: 'lowercase', label: 'Kisbetűsre', needsCustomValue: false, target: 'both' },
  { type: 'capitalize_words', label: 'Szavak nagybetűvel', needsCustomValue: false, target: 'both' },
  { type: 'comma_space', label: 'Vessző utáni szóköz', needsCustomValue: false, target: 'both' },
  { type: 'trim_start', label: 'Törlés az elejéről', needsCustomValue: true, target: 'both' },
  { type: 'trim_end', label: 'Törlés a végéről', needsCustomValue: true, target: 'both' },
  { type: 'trim_brackets', label: 'Zárójelek eltávolítása', needsCustomValue: false, target: 'both' },
];

/** Rövidítés → teljes forma párok (szóhatár-érzékeny csere) */
const POSITION_ABBREVIATIONS: [string, string][] = [
  ['of', 'osztályfőnök'],
  ['igh', 'igazgatóhelyettes'],
  ['tesi', 'testnevelés'],
  ['info', 'informatika'],
  ['matek', 'matematika'],
  ['fiz', 'fizika'],
  ['biosz', 'biológia'],
  ['kem', 'kémia'],
  ['föci', 'földrajz'],
  ['töri', 'történelem'],
  ['angol', 'angol nyelv'],
  ['német', 'német nyelv'],
  ['francia', 'francia nyelv'],
  ['olasz', 'olasz nyelv'],
  ['japán', 'japán nyelv'],
  ['kínai', 'kínai nyelv'],
  ['spanyol', 'spanyol nyelv'],
  ['orosz', 'orosz nyelv'],
  ['latin', 'latin nyelv'],
  ['ig', 'igazgató'],
  ['kp', 'kollégiumi pedagógus'],
  ['szkt', 'szakmai tantárgyak'],
];

/**
 * Pozíció normalizálása — régi rendszerből portolva.
 * 1. Kisbetűsre
 * 2. Szóközök normalizálása
 * 3. Pontosvessző → vessző
 * 4. Zárójelek eltávolítása
 * 5. Rövidítések kifejtése
 * 6. Pont eltávolítása elejéről/végéről
 */
export function normalizePosition(text: string): string {
  if (!text?.trim()) return text;

  // 1. Kisbetűsre
  let result = text.toLowerCase();

  // 2. Szóközök normalizálása
  result = result.replace(/\s+/g, ' ').trim();

  // 3. Pontosvessző → vessző, szóköz biztosítása vessző után
  result = result.replace(/;/g, ',');
  result = result.replace(/,(\S)/g, ', $1');

  // 4. Zárójelek eltávolítása
  result = result.replace(/^[(\[{]+|[)\]}]+$/g, '');
  result = result.trim();

  // 5. Rövidítések kifejtése (szóhatár-érzékeny)
  for (const [abbr, full] of POSITION_ABBREVIATIONS) {
    const regex = new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi');
    result = result.replace(regex, full);
  }

  // 6. "ny." → "nyelv" (pont miatt nem szóhatár)
  result = result.replace(/\bny\.\s*/gi, 'nyelv ');

  // 7. Pont eltávolítása elejéről/végéről
  result = result.replace(/^\.+|\.+$/g, '').trim();

  return result;
}

/** Szövegtranszformáció alkalmazása */
export function applyTextTransform(
  text: string,
  type: TextTransformType,
  customValue = '',
): string {
  if (!text && type !== 'normalize_position') return text;

  switch (type) {
    case 'normalize_position':
      return normalizePosition(text);

    case 'lowercase':
      return text.toLowerCase();

    case 'capitalize_words':
      return text.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());

    case 'comma_space':
      return text.replace(/,(\S)/g, ', $1');

    case 'trim_start':
      if (!customValue) return text;
      return text.replace(new RegExp(`^\\s*${escapeRegex(customValue)}\\s*`), '');

    case 'trim_end':
      if (!customValue) return text;
      return text.replace(new RegExp(`\\s*${escapeRegex(customValue)}\\s*$`), '');

    case 'trim_brackets':
      return text.replace(/^[(\[{]+|[)\]}]+$/g, '').trim();

    default:
      return text;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

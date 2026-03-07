/**
 * Szövegtranszformációk személynevekhez és pozíciókhoz.
 * A régi fotocms-admin rendszer normalizePosition() logikájából portolva + javítva.
 *
 * Valós DB pozíciók alapján (57 egyedi title):
 * igazgató, igazgatóhelyettes, főigazgató, főigazgató-helyettes,
 * osztályfőnök, osztályfőnök-helyettes, matematika, angol nyelv,
 * német nyelv, olasz nyelv, orosz nyelv, francia, földrajz, történelem,
 * fizika, biológia, kémia, informatika, testnevelés, ének-zene,
 * vizuális kultúra, mozgóképkultúra, rajz, magyar nyelv, stb.
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

/**
 * Rövidítés → teljes forma párok.
 * FONTOS: A csere CSAK AKKOR történik, ha a teljes forma NINCS már jelen.
 * A sorrend számít: hosszabb rövidítéseket előre! (pl. "igh" előbb mint "ig")
 */
const POSITION_ABBREVIATIONS: [string, string][] = [
  // Beosztások
  ['igh', 'igazgatóhelyettes'],
  ['of', 'osztályfőnök'],
  ['ig', 'igazgató'],
  ['kp', 'kollégiumi pedagógus'],
  ['szkt', 'szakmai tantárgyak'],
  // Tantárgyak
  ['tesi', 'testnevelés'],
  ['info', 'informatika'],
  ['matek', 'matematika'],
  ['biosz', 'biológia'],
  ['kem', 'kémia'],
  ['föci', 'földrajz'],
  ['töri', 'történelem'],
  ['fiz', 'fizika'],
];

/**
 * Nyelv rövidítések: "angol" → "angol nyelv", DE CSAK ha "angol nyelv" nincs már benne.
 * Külön kezeljük mert ezek ÖNÁLLÓ szóként is érvényesek lehetnek.
 */
const LANGUAGE_ABBREVIATIONS: string[] = [
  'angol', 'német', 'francia', 'olasz', 'japán', 'kínai',
  'spanyol', 'orosz', 'latin', 'magyar',
];

/**
 * Kötőjeles összetételek normalizálása.
 * "igazgató-helyettes" → "igazgatóhelyettes"
 * "osztályfőnök-helyettes" → "osztályfőnökhelyettes" — NEM, mert a DB-ben kötőjellel van!
 * Valós DB: "igazgatóhelyettes" (egybeírva), "osztályfőnök-helyettes" (kötőjellel)
 * Tehát: CSAK az "igazgató-helyettes" → "igazgatóhelyettes" cserét csináljuk.
 */
const HYPHEN_FIXES: [string, string][] = [
  ['igazgató-helyettes', 'igazgatóhelyettes'],
  ['intézményegység-vezető', 'intézményegységvezető'],
];

/**
 * Pozíció normalizálása.
 *
 * 1. Kisbetűsre
 * 2. Szóközök normalizálása
 * 3. Pontosvessző → vessző, szóköz biztosítása
 * 4. Kötőjeles összetételek javítása
 * 5. Rövidítések kifejtése (CSAK ha a teljes forma nincs már jelen)
 * 6. Nyelv rövidítések ("angol" → "angol nyelv", ha nincs már)
 * 7. Dupla "nyelv nyelv..." tisztítása
 * 8. Pont eltávolítása elejéről/végéről
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

  // 4. Kötőjeles összetételek javítása
  for (const [from, to] of HYPHEN_FIXES) {
    result = result.replace(new RegExp(escapeRegex(from), 'g'), to);
  }

  // 5. Rövidítések kifejtése — CSAK ha a teljes forma nincs már jelen
  for (const [abbr, full] of POSITION_ABBREVIATIONS) {
    // Ha a teljes forma már benne van, skip
    if (result.includes(full)) continue;
    const regex = new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi');
    result = result.replace(regex, full);
  }

  // 6. "ny." → "nyelv" (pont miatt nem szóhatár)
  result = result.replace(/\bny\.\s*/gi, 'nyelv ');

  // 7. Nyelv rövidítések: "angol" → "angol nyelv" (CSAK ha nincs utána már "nyelv")
  for (const lang of LANGUAGE_ABBREVIATIONS) {
    // Match: a nyelv szó NINCS utána közvetlenül "nyelv"
    const regex = new RegExp(`\\b${escapeRegex(lang)}\\b(?!\\s+nyelv)`, 'gi');
    result = result.replace(regex, `${lang} nyelv`);
  }

  // 8. Dupla "nyelv nyelv..." tisztítása (biztonsági háló)
  result = result.replace(/(\bnyelv)(\s+nyelv)+/gi, '$1');

  // 9. Zárójelek eltávolítása az elejéről/végéről
  result = result.replace(/^[(\[{]+|[)\]}]+$/g, '');

  // 10. Pont eltávolítása elejéről/végéről, végső trim
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

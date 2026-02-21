export interface FileMatchResult {
  file: File;
  personId: number | null;
  personName: string | null;
  matchType: 'matched' | 'ambiguous' | 'unmatched';
  confidence: number;
}

interface PersonEntry {
  id: number;
  name: string;
}

const MIN_MATCH_THRESHOLD = 50;
const AMBIGUITY_MARGIN = 10;
const SCORE_EXACT = 100;
const SCORE_WORD_REORDER = 95;
const SCORE_CONTAINS = 80;
const SCORE_WORD_OVERLAP = 75;

const ACCENT_MAP: Record<string, RegExp> = {
  a: /[áàâä]/g,
  e: /[éèêë]/g,
  i: /[íìîï]/g,
  o: /[óòôöő]/g,
  u: /[úùûüű]/g,
};

function removeAccents(str: string): string {
  let result = str;
  for (const [replacement, pattern] of Object.entries(ACCENT_MAP)) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function normalizeName(name: string): string {
  return removeAccents(name.toLowerCase()).replace(/\s+/g, ' ').trim();
}

function extractNameFromFilename(filename: string): string {
  const dotIdx = filename.lastIndexOf('.');
  let name = dotIdx > 0 ? filename.substring(0, dotIdx) : filename;
  name = name.replace(/[_\-.]/g, ' ');
  name = name.replace(/\s+\d+[a-zA-Z]?\s*$/, '');
  return name.trim();
}

function sortedWords(str: string): string {
  return str.split(' ').sort().join(' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function calculateMatchScore(input: string, target: string): number {
  if (input === target) return SCORE_EXACT;

  if (sortedWords(input) === sortedWords(target)) return SCORE_WORD_REORDER;

  if (target.includes(input) || input.includes(target)) return SCORE_CONTAINS;

  const inputArr = input.split(' ');
  const targetArr = target.split(' ');
  const common = inputArr.filter(w => targetArr.includes(w)).length;
  const total = Math.max(inputArr.length, targetArr.length);
  if (common > 0 && common >= total - 1) return SCORE_WORD_OVERLAP;

  const maxLen = Math.max(input.length, target.length);
  if (maxLen === 0) return 0;
  if (Math.abs(input.length - target.length) > maxLen * 0.5) return 0;

  const distance = levenshtein(input, target);
  return Math.max(Math.round((1 - distance / maxLen) * 100), 0);
}

/**
 * Fajlnevek parosítasa szemelylista alapjan.
 * Greedy assignment: fajlonkent a legjobb szemely, ha mar foglalt → kovetkezo.
 */
export function matchFilesToPersons(
  files: File[],
  persons: PersonEntry[],
): FileMatchResult[] {
  const normalizedPersons = persons.map(p => ({
    ...p,
    normalized: normalizeName(p.name),
  }));

  // Minden fajlhoz kiszamitjuk az osszes szemely score-jat
  const fileScores = files.map(file => {
    const cleanName = extractNameFromFilename(file.name);
    const normalizedInput = normalizeName(cleanName);

    if (!normalizedInput) {
      return { file, candidates: [] as Array<{ personId: number; personName: string; score: number }> };
    }

    const candidates = normalizedPersons
      .map(p => ({
        personId: p.id,
        personName: p.name,
        score: calculateMatchScore(normalizedInput, p.normalized),
      }))
      .filter(c => c.score >= MIN_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    return { file, candidates };
  });

  // Greedy assignment
  const assignedPersonIds = new Set<number>();
  const results: FileMatchResult[] = [];

  for (const { file, candidates } of fileScores) {
    const available = candidates.filter(c => !assignedPersonIds.has(c.personId));

    if (available.length === 0) {
      results.push({
        file,
        personId: null,
        personName: null,
        matchType: 'unmatched',
        confidence: 0,
      });
      continue;
    }

    const best = available[0];
    const isAmbiguous = available.length > 1
      && available[1].score >= best.score - AMBIGUITY_MARGIN;

    assignedPersonIds.add(best.personId);
    results.push({
      file,
      personId: best.personId,
      personName: best.personName,
      matchType: isAmbiguous ? 'ambiguous' : 'matched',
      confidence: best.score,
    });
  }

  return results;
}

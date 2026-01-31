/**
 * Time Formatter Utility
 *
 * Relatív időformázás magyar nyelven.
 * Használható: fórum, kommentek, értesítések, stb.
 */

/**
 * Relatív idő formázás magyar nyelven
 *
 * @param dateStr - ISO dátum string
 * @returns Magyar nyelvű relatív idő (pl. "5 perce", "2 órája", "3 napja")
 *
 * @example
 * formatTimeAgo('2024-01-15T10:30:00Z') // => "2 órája"
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'most';
  if (diffMins < 60) return `${diffMins} perce`;
  if (diffHours < 24) return `${diffHours} órája`;
  if (diffDays < 7) return `${diffDays} napja`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hete`;
  return `${Math.floor(diffDays / 30)} hónapja`;
}

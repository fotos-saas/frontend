/**
 * Szöveg rövidítése a közepéből.
 *
 * Megtartja az elejét és a végét, a közepet „…"-lal helyettesíti.
 * Szó határon vág (nem töri meg a szavakat).
 *
 * Példa: "Szegedi Radnóti Miklós Kísérleti Gimnázium 12.A 2025/2026"
 *       → "Szegedi Radnóti…12.A 2025/2026" (maxLength=30)
 */
export function abbreviateMiddle(
  text: string,
  maxLength = 40,
  ellipsis = '\u2026', // …
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const available = maxLength - ellipsis.length;
  const headLen = Math.ceil(available * 0.6);
  const tailLen = available - headLen;

  let head = trimmed.substring(0, headLen);
  let tail = trimmed.substring(trimmed.length - tailLen);

  // Szó határon vágjuk az elejét
  const lastSpace = head.lastIndexOf(' ');
  if (lastSpace > 3) {
    head = head.substring(0, lastSpace);
  }

  // Szó határon vágjuk a végét
  const firstSpace = tail.indexOf(' ');
  if (firstSpace !== -1 && firstSpace < tail.length - 3) {
    tail = tail.substring(firstSpace + 1);
  }

  return head.trim() + ellipsis + tail.trim();
}

/**
 * Projekt rövid neve fájlnév célra.
 *
 * Formátum: "{rövidített név} ({id})"
 * Pl.: "Szegedi…12.A 2025-2026 (454)"
 */
export function projectShortName(
  projectName: string,
  projectId: number,
  maxLength = 50,
): string {
  let name = projectName.replace(/[\/\\:*?"<>|]/g, '_');
  name = name.replace(/\//g, '-');

  const suffix = ` (${projectId})`;
  const nameMaxLen = maxLength - suffix.length;

  return abbreviateMiddle(name, nameMaxLen).trim() + suffix;
}

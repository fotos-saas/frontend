/**
 * Tanév opciók generálása (aktuális évtől visszafelé).
 */
export function generateYearOptions(count = 10): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: `${currentYear - i}`,
  }));
}

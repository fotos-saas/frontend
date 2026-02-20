/** Aktuális tanév (graduation year): szept 1-től a következő év. */
export function getCurrentGraduationYear(): number {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
}

/** Tanév opciók generálása (aktuális tanévtől visszafelé). */
export function generateYearOptions(count = 10): { value: string; label: string }[] {
  const currentYear = getCurrentGraduationYear();
  return Array.from({ length: count }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: `${currentYear - i}`,
  }));
}

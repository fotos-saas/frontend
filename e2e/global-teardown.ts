/**
 * Global teardown a Journey tesztekhez.
 *
 * Lefut EGYSZER a teljes teszt suite UTÁN.
 * Jelenleg nincs speciális cleanup — a DB marad a debug-hoz.
 */
export default async function globalTeardown(): Promise<void> {
  console.log('[E2E Teardown] Journey tesztek befejezve.');
}

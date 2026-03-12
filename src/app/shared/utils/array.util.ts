/**
 * Tömb chunk-okra bontása.
 * @param array A bemeneti tömb
 * @param size Egy chunk maximális mérete
 * @returns Chunk-ok tömbje
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

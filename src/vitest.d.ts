// Vitest globális típusok
// Ez a fájl biztosítja az autocompletion-t a Vitest API-hoz

/// <reference types="vitest" />

declare global {
  // Vitest test funkcionalitás
  const describe: typeof import('vitest').describe;
  const it: typeof import('vitest').it;
  const test: typeof import('vitest').test;
  const expect: typeof import('vitest').expect;
  const assert: typeof import('vitest').assert;
  const vi: typeof import('vitest').vi;

  // Lifecycle hooks
  const beforeAll: typeof import('vitest').beforeAll;
  const afterAll: typeof import('vitest').afterAll;
  const beforeEach: typeof import('vitest').beforeEach;
  const afterEach: typeof import('vitest').afterEach;
}

export {};

import { describe, it, expect, vi } from 'vitest';
import { DestroyRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { createResourceLoader, ResourceLoader } from './resource-loader.util';

// Mock inject() — createResourceLoader-ben inject(DestroyRef) és inject(LoggerService)
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
};

const mockDestroyRef: DestroyRef = {
  onDestroy: vi.fn(),
} as unknown as DestroyRef;

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return {
    ...actual,
    inject: vi.fn((token: unknown) => {
      if (token === DestroyRef) return mockDestroyRef;
      // LoggerService
      return mockLogger;
    }),
  };
});

describe('resource-loader.util', () => {
  let rl: ResourceLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    rl = createResourceLoader();
  });

  it('loading signal alapértéke true', () => {
    expect(rl.loading()).toBe(true);
  });

  it('load() sikeres adat esetén meghívja a setter-t és loading false lesz', () => {
    const setter = vi.fn();
    rl.load(of({ name: 'teszt' }), setter, 'Hiba üzenet');

    expect(setter).toHaveBeenCalledWith({ name: 'teszt' });
    expect(rl.loading()).toBe(false);
  });

  it('load() hiba esetén logger.error-t hív és loading false lesz', () => {
    const setter = vi.fn();
    const error = new Error('API hiba');
    rl.load(throwError(() => error), setter, 'Betöltési hiba');

    expect(setter).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Betöltési hiba', error);
    expect(rl.loading()).toBe(false);
  });

  it('load() újrahíváskor loading true-ra áll', () => {
    const subject = new Subject<string>();
    const setter = vi.fn();

    rl.load(subject.asObservable(), setter, 'Hiba');
    expect(rl.loading()).toBe(true);

    subject.next('adat');
    expect(rl.loading()).toBe(false);

    // Újrahívás
    rl.load(subject.asObservable(), setter, 'Hiba');
    expect(rl.loading()).toBe(true);
  });

  it('elfogad explicit DestroyRef paramétert', () => {
    const customDestroyRef: DestroyRef = {
      onDestroy: vi.fn(),
    } as unknown as DestroyRef;

    const rl2 = createResourceLoader(customDestroyRef);
    const setter = vi.fn();
    rl2.load(of('adat'), setter, 'Hiba');

    expect(setter).toHaveBeenCalledWith('adat');
    expect(rl2.loading()).toBe(false);
  });

  it('generikus típust helyesen kezeli a load metódusban', () => {
    interface TestData { id: number; name: string }
    const setter = vi.fn<(data: TestData) => void>();
    const testData: TestData = { id: 1, name: 'teszt' };

    rl.load(of(testData), setter, 'Hiba');

    expect(setter).toHaveBeenCalledWith(testData);
  });

  it('több load() hívás különböző típusokkal is működik', () => {
    const stringSetter = vi.fn<(data: string) => void>();
    const numberSetter = vi.fn<(data: number) => void>();

    rl.load(of('szöveg'), stringSetter, 'String hiba');
    rl.load(of(42), numberSetter, 'Number hiba');

    expect(stringSetter).toHaveBeenCalledWith('szöveg');
    expect(numberSetter).toHaveBeenCalledWith(42);
    expect(rl.loading()).toBe(false);
  });
});

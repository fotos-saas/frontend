/**
 * Vitest Példa - Angular 19
 *
 * Ez a fájl mutatja a Vitest szintaxist és az Angular tesztelési minta.
 *
 * FUTTATÁS:
 * - npm run test          (egy alkalom)
 * - npm run test:watch    (figyelési mód)
 * - npm run test:ui       (interaktív UI)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================
// 1. Alapvető Vitest szintaxis
// ============================================

describe('Vitest Basics', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
  });

  it('should check equality', () => {
    const obj1 = { name: 'test' };
    const obj2 = { name: 'test' };

    expect(obj1).toEqual(obj2); // Deep equality
    expect(obj1).not.toBe(obj2); // Different instances
  });

  it('should check truthy values', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
    expect('text').toBeTruthy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
  });
});

// ============================================
// 2. Async tesztek
// ============================================

describe('Async Tests', () => {
  it('should handle promises', async () => {
    const promise = Promise.resolve('value');
    await expect(promise).resolves.toBe('value');
  });

  it('should handle rejected promises', async () => {
    const promise = Promise.reject(new Error('Error message'));
    await expect(promise).rejects.toThrow('Error message');
  });

  it('should wait for async function', async () => {
    const asyncFn = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('done'), 100);
      });
    };

    const result = await asyncFn();
    expect(result).toBe('done');
  });
});

// ============================================
// 3. beforeEach hook (setup)
// ============================================

describe('Setup and Teardown', () => {
  let counter = 0;

  beforeEach(() => {
    counter = 0; // Resetelés minden test előtt
  });

  it('should have counter = 0', () => {
    expect(counter).toBe(0);
    counter++;
  });

  it('should reset counter', () => {
    // Counter resetelve az előző test után
    expect(counter).toBe(0);
  });
});

// ============================================
// 4. String és Array tesztek
// ============================================

describe('String and Array Assertions', () => {
  it('should check strings', () => {
    const text = 'Hello World';
    expect(text).toContain('World');
    expect(text).toMatch(/hello/i); // Case insensitive regex
    expect(text).toHaveLength(11);
  });

  it('should check arrays', () => {
    const array = [1, 2, 3, 4, 5];
    expect(array).toContain(3);
    expect(array).toHaveLength(5);
    expect(array).toEqual([1, 2, 3, 4, 5]);
  });
});

// ============================================
// 5. Objektum tesztek
// ============================================

describe('Object Assertions', () => {
  const user = {
    name: 'John',
    email: 'john@example.com',
    age: 30,
  };

  it('should check object properties', () => {
    expect(user).toHaveProperty('name', 'John');
    expect(user).toHaveProperty('email');
  });

  it('should check partial match', () => {
    expect(user).toMatchObject({
      name: 'John',
      email: 'john@example.com',
    });
  });
});

// ============================================
// 6. Callback-alapú tesztek (könnyen konvertálható asyncra)
// ============================================

describe('Callback Tests', () => {
  it('should handle callback style', (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done(); // Jelzi a Vitest-nek, hogy kész
    }, 10);
  });
});

// ============================================
// 7. Snapshot tesztek (komponensek HTML-jéhez)
// ============================================

describe('Snapshot Tests', () => {
  it('should match snapshot', () => {
    const component = { template: '<div>Hello</div>' };
    expect(component).toMatchSnapshot();
  });
});

// ============================================
// VITEST KOMMENT SZINTAXIST
// ============================================

// it.only - Csak ezt a tesztet futtatja
// it.skip - Ezt a tesztet kihagyja
// describe.only - Csak ezt a suite-ot futtatja
// describe.skip - Ezt a suite-ot kihagyja

describe('Selective Testing', () => {
  it.skip('should skip this test', () => {
    // Ez nem fog futni
    expect(true).toBe(false);
  });

  it('should run this test', () => {
    expect(true).toBe(true);
  });
});

// ============================================
// MEGJEGYZÉS: Angular komponens tesztek
// ============================================

// A komponens tesztek külön spec fájlban vannak:
// - src/app/components/my.component.spec.ts
//
// Általános minta:
//
// import { TestBed, ComponentFixture } from '@angular/core/testing';
// import { MyComponent } from './my.component';
//
// describe('MyComponent', () => {
//   let fixture: ComponentFixture<MyComponent>;
//   let component: MyComponent;
//
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [MyComponent],
//     }).compileComponents();
//
//     fixture = TestBed.createComponent(MyComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });
//
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });

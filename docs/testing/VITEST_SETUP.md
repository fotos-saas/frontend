# Vitest Setup - Angular 19 Projekt

## Telepítés

```bash
npm install
```

## Fájlok

### Konfigurációs fájlok

1. **vite.config.mts** - Vitest + Vite + Angular plugin konfigurációja
2. **vitest.config.ts** - Alternatív TypeScript konfigurációja
3. **src/test-setup.ts** - Angular Testing Module globális inicializálása
4. **src/vitest.d.ts** - Vitest globális típusok (IDE autocompletion)
5. **tsconfig.spec.json** - TypeScript spec konfigurációja
6. **tsconfig.json** - Frissített vitest/globals típusokkal

### Karma eltávolítva

- ~~karma~~ ❌ Eltávolítva
- ~~karma-chrome-launcher~~ ❌ Eltávolítva
- ~~karma-coverage~~ ❌ Eltávolítva
- ~~karma-jasmine~~ ❌ Eltávolítva
- ~~karma-jasmine-html-reporter~~ ❌ Eltávolítva
- ~~@types/jasmine~~ ❌ Eltávolítva
- ~~jasmine-core~~ ❌ Eltávolítva

### Vitest stacket hozzáadva

- ✅ vitest
- ✅ @analogjs/vite-plugin-angular (Angular + Vite integráció)
- ✅ @testing-library/angular (Modern testing library)
- ✅ @testing-library/user-event (User interaction simulation)
- ✅ @testing-library/dom (DOM utility-k)
- ✅ jsdom (DOM environment)
- ✅ vite (Build tool)
- ✅ @vitest/ui (Test UI)

## Parancsok

```bash
# Tesztek futtatása (egy alkalommal)
npm run test

# Tesztek figyelési mód (automatikus újra futtatás)
npm run test:watch

# Coverage report generálása
npm run test:coverage

# Vitest UI - Interaktív test futtatás
npm run test:ui
```

## Tesztfájl Példa

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';
import { render, screen } from '@testing-library/angular';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', async () => {
    const { container } = await render(MyComponent);
    const title = screen.getByRole('heading', { name: /title/i });
    expect(title).toBeInTheDocument();
  });
});
```

## Vitest API Globals

A `globals: true` beállítás miatt a `describe`, `it`, `expect` stb. automatikusan importálódnak:

```typescript
// NEM szükséges: import { describe, it, expect } from 'vitest';

describe('MyTest', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

## Coverage Report

```bash
npm run test:coverage
```

A report az `coverage/` mappában lesz:

```
coverage/
├── index.html     (Interaktív report)
├── coverage-final.json
├── lcov.info
└── lcov-report/
```

## Vitest UI

```bash
npm run test:ui
```

Megnyitja az interaktív test interfészt `localhost:51204`-en (vagy valamilyen porton):

- ✅ Live test futtatás
- ✅ Test fájl megnyitása
- ✅ Coverage vizualizáció
- ✅ Stack trace deep dive

## Angular Testing Library

A tesztek `@testing-library/angular`-t használnak az Angular-specifikus tesztekhez:

### Rendering

```typescript
import { render } from '@testing-library/angular';

const { container } = await render(MyComponent, {
  imports: [MyDependency],
  providers: [MyService],
});
```

### Queries

```typescript
import { screen } from '@testing-library/angular';

// By role (AJÁNLOTT)
const button = screen.getByRole('button', { name: /click/i });

// By label text
const input = screen.getByLabelText(/email/i);

// By placeholder
const search = screen.getByPlaceholderText(/search/i);

// By text
const text = screen.getByText(/hello/i);

// By test id
const element = screen.getByTestId('special-element');
```

### User Interactions

```typescript
import { userEvent } from '@testing-library/angular';

const user = userEvent.setup();

// Gépelés
await user.type(input, 'hello@example.com');

// Kattintás
await user.click(button);

// Kiválasztás select-ből
await user.selectOptions(select, 'option1');

// Tab navigáció
await user.tab();
```

## Vitest Syntax

### Test Definíció

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Test
  });

  // Alias
  test('alternative syntax', () => {
    // Test
  });
});
```

### Lifecycle Hooks

```typescript
describe('Feature', () => {
  beforeAll(() => {
    // Futtatódik egyszer az összes test előtt
  });

  beforeEach(() => {
    // Futtatódik minden test előtt
  });

  afterEach(() => {
    // Futtatódik minden test után
  });

  afterAll(() => {
    // Futtatódik egyszer az összes test után
  });

  it('test', () => {});
});
```

### Mocking (vi)

```typescript
import { vi } from 'vitest';

// Function mock
const mockFn = vi.fn();
mockFn('arg1');
expect(mockFn).toHaveBeenCalledWith('arg1');

// Implementation mock
const mockImpl = vi.fn((x) => x * 2);
expect(mockImpl(5)).toBe(10);

// Spy on method
const spy = vi.spyOn(obj, 'method');
```

### Assertions

```typescript
// Alapvető
expect(value).toBe(expectedValue);
expect(value).toEqual(expectedValue);
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// String
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Array
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Object
expect(obj).toHaveProperty('key', value);

// DOM
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveClass('className');
expect(element).toHaveAttribute('id', 'test');

// Async
expect(asyncFn()).resolves.toBe(value);
expect(asyncFn()).rejects.toThrow();
```

## Hibaelhárítás

### "Cannot find module" hiba

```bash
# Pakik frissítése
npm install

# Vite cache törlése
rm -rf node_modules/.vite
```

### "setupFiles not found"

Biztosítsd, hogy az `src/test-setup.ts` létezik és helyes az elérési útja.

### "Angular CLI not found"

A `@analogjs/vite-plugin-angular` plugin helyettesíti az Angular CLI-t a Vitest-nél. Az `ng serve` továbbra is működik.

### Coverage nem jól működik

```bash
# Vitest v8 coverage provider
npm run test:coverage

# HTML report megnyitása
open coverage/index.html
```

## Best Practices

1. **TestBed.configureTestingModule()** - Angular komponensekhez
2. **render() + screen queries** - Testing Library módszer
3. **userEvent.setup()** - User interaction szimuláció
4. **vi.fn(), vi.spyOn()** - Mocking és spying
5. **globals: true** - Vitest import automatizálása

## Angular + Vitest Workflow

1. Komponens létrehozása (pl. `MyComponent`)
2. Test fájl létrehozása (pl. `my.component.spec.ts`)
3. `npm run test:watch` futtatása fejlesztéshez
4. `npm run test` futtatása CI/CD-ben
5. `npm run test:coverage` a coverage reporthoz

## Storybook Integrációja

Ha Storybookot is használsz:

```bash
# Storybook tesztek futtatása Vitest-tel
npm run test -- --run src/**/*.stories.ts
```

## Migráció Karma-ról Vitest-re

### Régi Karma szintaxis

```typescript
// ❌ Karma (régi)
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyComponent],
    }).compileComponents();
  });
});
```

### Új Vitest szintaxis

```typescript
// ✅ Vitest (új)
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MyComponent } from './my.component';
import { render } from '@testing-library/angular';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    // TestBed továbbra is működik!
    fixture = TestBed.createComponent(MyComponent);
  });

  // VAGY Testing Library módszer
  it('should render', async () => {
    const { container } = await render(MyComponent);
    expect(container).toBeTruthy();
  });
});
```

## Hasznos Linkek

- [Vitest Dokumentáció](https://vitest.dev/)
- [Angular Testing Library](https://github.com/testing-library/angular)
- [Vitest Angular Plugin](https://github.com/analogjs/analog)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## Támogatott Angular Verziók

- ✅ Angular 19
- ✅ Angular 18
- ✅ Angular 17
- ✅ Idősebb verziók (megfelelő plugin verzióval)

## Performance

- ⚡ **Vitest** = Vite szimultal → SOKKAL gyorsabb mint Karma
- 🚀 **Watch mode** = Hot module reload tesztek
- 📦 **Parallel tesztek** = Multi-threaded futtatás (alapesetben ON)

## Egyéb Opciók

### Disable Threading

```typescript
// vite.config.mts
test: {
  threads: false, // Single-threaded mode
}
```

### Environment váltás

```typescript
// Lehetőségek: 'jsdom', 'node', 'happy-dom'
test: {
  environment: 'jsdom',
}
```

### Reporter módosítása

```typescript
// Lehetőségek: 'default', 'verbose', 'dot', 'junit', stb.
test: {
  reporters: ['verbose', 'junit'],
}
```

---

**Készen van a Vitest!** 🎉 Futtatd: `npm install` és `npm run test:watch`

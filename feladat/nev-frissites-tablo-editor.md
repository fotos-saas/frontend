# Nevek frissítése az adatbázisból — Tábló Editor

## Mi kell

A "Nevek" gomb melletti dropdown-ba (ahol a gap, sortörés, igazítás van) egy **"Nevek frissítése"** funkció. Kijelölt layer-ek (vagy mind) szöveges tartalmát frissíti az adatbázis person nevéből.

**Use case:** Az adatbázisban átírtad a nevet (pl. elírás javítás, ékezet) → a PSD-ben a régi név van → "Nevek frissítése" → a PSD text layer tartalma frissül.

## Érintett fájlok

| Fájl | Szerepe |
|------|---------|
| `layout-toolbar.component.ts` | Toolbar UI — új gomb a Nevek dropdown-ba (sor 341-404) |
| `layout-designer.component.ts` | Új `refreshNames()` metódus |
| `photoshop.service.ts` | Új `refreshNameTexts()` metódus — JSX hívás |
| `layout-designer-state.service.ts` | `persons` + `layers` signal adatok |
| `arrange-names.jsx` VAGY új `refresh-name-texts.jsx` | JSX: text layer tartalom frissítés |

## Logika

### 1. Frontend (layout-designer.component.ts)

```
refreshNames(selectedOnly: boolean):
  1. layers = state.layers()
  2. Ha selectedOnly → csak state.selectedLayers()
  3. Szűrés: category === 'student-name' || 'teacher-name'
  4. Minden name layer-hez:
     - layerName-ből kinyeri a slug-ot (pl. "kiss_janos---42" → slug "kiss_janos", id 42)
     - persons()-ból megkeresi id alapján → person.name (pl. "Kiss János")
     - nameBreakAfter beállítás alapján sortörés (pl. "Kiss\rJános")
  5. refreshMap = [{ layerName: "..._name", newText: "Kiss\rJános" }, ...]
  6. photoshopService.refreshNameTexts(refreshMap)
```

### 2. Name layer és image layer kapcsolat

A PSD-ben:
- Image layer: `kiss_janos---42` (Images/Students csoportban)
- Name layer: `kiss_janos---42_name` (Names/Students csoportban)

A name layer neve = image layer neve + `_name` suffix.

Szóval a name layer `layerName`-éből (`kiss_janos---42_name`):
1. Levesszük a `_name` suffixet → `kiss_janos---42`
2. Kinyerjük az ID-t: `42`
3. Persons-ból megkeressük: `persons.find(p => p.id === 42)` → `{ name: "Kiss János" }`

### 3. JSX Script (refresh-name-texts.jsx)

Egyszerű script — nem pozícionál, csak a szöveges tartalmat cseréli:

```javascript
// Input: { layers: [{ layerName: "kiss_janos---42_name", newText: "Kiss\rJános" }] }
//
// Minden layer-re:
//   1. Megkeresi a layer-t a Names csoportban (name alapján)
//   2. textItem.contents = newText
//   3. Kész
```

**FONTOS:** Nem kell pozícionálni — az a "Nevek" (arrange) gomb dolga. Ez CSAK a szöveget írja át.

### 4. Toolbar UI

A "Nevek" settings dropdown-ba (sor 341-404) egy új gomb:

```html
<button class="toolbar-btn" (click)="refreshNamesClicked.emit()">
  <lucide-icon [name]="ICONS.REFRESH_CW" [size]="14" />
  <span>Nevek frissítése</span>
</button>
```

Vagy ha selectedOnly kell:
- "Kijelöltek nevének frissítése" (ha van kijelölés)
- "Összes név frissítése" (ha nincs kijelölés)

### 5. nameBreakAfter alkalmazása

A `photoshop.service.ts`-ben lévő `nameBreakAfter` signal-t használjuk:
- 0 = nincs sortörés
- 1 = első szó után
- 2 = második szó után

A `arrange-names.jsx` `_breakName()` (sor 44-74) logikáját kell TypeScript-be is portolni (prefix felismerés: Dr., Cs., stb.)

## Összefoglalás

| # | Lépés | Fájl |
|---|-------|------|
| 1 | Toolbar-ba "Nevek frissítése" gomb | `layout-toolbar.component.ts` |
| 2 | `refreshNames()` metódus | `layout-designer.component.ts` |
| 3 | `refreshNameTexts()` service metódus | `photoshop.service.ts` |
| 4 | JSX script: text content csere | `electron/scripts/.../refresh-name-texts.jsx` |

~100 sor kód összesen. Nincs backend módosítás — a persons adat már betöltve van a state-be.

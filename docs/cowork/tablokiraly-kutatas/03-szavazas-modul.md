# Szavazás Modul (Voting) - Részletes Dokumentáció

> Kutatás dátuma: 2025-01-19

## Áttekintés

A szavazás modul lehetővé teszi, hogy az osztály közösen döntsön a tabló sablonjáról vagy egyéb kérdésekről.

---

## Komponensek

### voting-list
- Szavazások listázása
- Aktív/lezárt szűrés
- Üres állapot kezelése
- Létrehozás gomb (kapcsolattartónak)

### voting-card
- Szavazás kártya megjelenítése
- Státusz badge (aktív/lezárt)
- Részvételi arány
- Szavazatok száma

### voting-detail
- Részletes szavazás nézet
- Opciók megjelenítése
- Szavazat leadása/visszavonása
- Eredmények (ha látható)

### voting-create-dialog
- Új szavazás létrehozása
- Típus választás (template/custom)
- Beállítások megadása

### voting-edit-dialog
- Meglévő szavazás szerkesztése
- Csak kapcsolattartónak

### voting-results
- Eredmények vizualizáció
- Százalékos megoszlás
- Szavazók száma

---

## Adatmodellek

### Poll (Szavazás)
```typescript
interface Poll {
  id: number;
  title: string;
  description: string | null;
  type: 'template' | 'custom';
  isActive: boolean;
  isMultipleChoice: boolean;
  maxVotesPerGuest: number;
  showResultsBeforeVote: boolean;
  useForFinalization: boolean;
  closeAt: string | null;
  isOpen: boolean;
  canVote?: boolean;
  myVotes: number[];           // Saját szavazataim option ID-k
  totalVotes?: number;
  uniqueVoters?: number;
  optionsCount?: number;
  options?: PollOption[];
  participationRate?: number;
  createdAt: string;
}
```

### PollOption (Szavazási Opció)
```typescript
interface PollOption {
  id: number;
  label: string;
  description: string | null;
  imageUrl: string | null;      // Sablon thumbnail
  templateId: number | null;    // Sablon ID (ha template típusú)
  templateName: string | null;
  votesCount?: number;
  percentage?: number;
}
```

### PollResults (Eredmények)
```typescript
interface PollResults {
  pollId: number;
  title: string;
  isOpen: boolean;
  totalVotes: number;
  uniqueVoters: number;
  participationRate?: number;
  options: PollOption[];
}
```

---

## Szavazás Típusok

### 1. Template (Sablon alapú)
- Meglévő tablósablonok közüli választás
- Automatikusan betölti a sablon képeket
- Véglegesítéshez kapcsolható

### 2. Custom (Egyedi)
- Bármilyen kérdés feltehető
- Manuálisan megadott opciók
- Opcionálisan kép csatolható

---

## Beállítások

| Beállítás | Típus | Alapértelmezett | Leírás |
|-----------|-------|-----------------|--------|
| `isMultipleChoice` | boolean | false | Több opció választható |
| `maxVotesPerGuest` | number | 1 | Max szavazat/vendég |
| `showResultsBeforeVote` | boolean | false | Eredmények láthatók szavazás előtt |
| `useForFinalization` | boolean | false | Véglegesítésnél figyelembe veszi |
| `closeAt` | datetime | null | Automatikus lezárás időpontja |

---

## API Endpoint-ok

| Metódus | Endpoint | Leírás |
|---------|----------|--------|
| GET | `/tablo-frontend/polls` | Szavazások listája |
| GET | `/tablo-frontend/polls/:id` | Szavazás részletei |
| POST | `/tablo-frontend/polls` | Új szavazás létrehozása |
| PUT | `/tablo-frontend/polls/:id` | Szavazás szerkesztése |
| DELETE | `/tablo-frontend/polls/:id` | Szavazás törlése |
| POST | `/tablo-frontend/polls/:id/vote` | Szavazat leadása |
| DELETE | `/tablo-frontend/polls/:id/vote/:optionId` | Szavazat visszavonása |
| POST | `/tablo-frontend/polls/:id/close` | Szavazás lezárása |
| POST | `/tablo-frontend/polls/:id/reopen` | Szavazás újranyitása |
| GET | `/tablo-frontend/polls/:id/results` | Eredmények lekérése |
| GET | `/tablo-frontend/polls/:id/participants` | Szavazók listája |

---

## User Flow-k

### Szavazat Leadása (Vendég)
```
1. Szavazás lista → Kártya kattintás
2. voting-detail betöltés
3. Opció kiválasztása
4. "Szavazok" gomb
5. POST /polls/:id/vote
6. UI frissítés (myVotes, canVote)
```

### Szavazás Létrehozása (Kapcsolattartó)
```
1. "Új szavazás" gomb
2. voting-create-dialog megnyitása
3. Típus választás (template/custom)
4. Beállítások kitöltése
5. Opciók hozzáadása
6. POST /polls
7. Lista frissítés
```

### Eredmények Megtekintése
```
1. Szavazás detail megnyitása
2. Ha showResultsBeforeVote || !isOpen:
   - Eredmények láthatók
3. Különben:
   - "Eredmények a szavazás után" üzenet
```

---

## Konstansok

```typescript
// voting.constants.ts
export const VOTING_CONSTANTS = {
  MAX_OPTIONS: 10,
  MIN_OPTIONS: 2,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_OPTION_LABEL_LENGTH: 100,
  DEFAULT_MAX_VOTES: 1,
};
```

---

## State Management

### voting-list.state.ts
- Szavazások lista állapota
- Loading/error kezelés
- Szűrés és rendezés

### voting-detail.state.ts
- Aktuális szavazás állapota
- Szavazat leadás/visszavonás
- Eredmények cache

---

## Storybook

A komponensek rendelkeznek Storybook story-kkal:
- `voting-card.stories.ts`
- `voting-list.stories.ts`
- `voting-detail.stories.ts`
- `voting-create-dialog.stories.ts`

# Fórum Modul - Részletes Dokumentáció

> Kutatás dátuma: 2025-01-19

## Áttekintés

A fórum modul az osztály közös kommunikációs felülete, ahol a diákok és a kapcsolattartó beszélgetéseket folytathatnak.

---

## Komponensek

### forum-list
- Beszélgetések listázása
- Kitűzött témák kiemelése
- Keresés és szűrés
- "Új téma" gomb (kapcsolattartónak)

### forum-card
- Beszélgetés kártya
- Utolsó aktivitás
- Hozzászólások száma
- Kitűzött/zárolt badge

### forum-detail
- Beszélgetés részletes nézete
- Hozzászólások listája
- Új hozzászólás írása
- Moderációs műveletek

### forum-post
- Egyedi hozzászólás megjelenítése
- Like gomb
- Válasz gomb
- Szerkesztés/törlés (saját)
- Beágyazott válaszok

### create-discussion-dialog
- Új beszélgetés létrehozása
- Cím és kezdő hozzászólás
- Sablon kapcsolás (opcionális)

---

## Adatmodellek

### Discussion (Beszélgetés)
```typescript
interface Discussion {
  id: number;
  title: string;
  slug: string;
  templateId: number | null;     // Ha sablon témájú
  templateName: string | null;
  isPinned: boolean;             // Kitűzött
  isLocked: boolean;             // Zárolt (nincs új hozzászólás)
  postsCount: number;
  lastActivityAt: string;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
    isCoordinator: boolean;
  };
}
```

### DiscussionPost (Hozzászólás)
```typescript
interface DiscussionPost {
  id: number;
  discussionId: number;
  content: string;               // Rich text (HTML)
  parentId: number | null;       // Válasz esetén a szülő ID
  likesCount: number;
  isLikedByMe: boolean;
  canEdit: boolean;              // 15 perc szabály
  canDelete: boolean;
  createdAt: string;
  updatedAt: string | null;
  author: {
    id: number;
    name: string;
    isCoordinator: boolean;
    isGuest: boolean;
  };
  replies?: DiscussionPost[];    // Beágyazott válaszok
  mentions?: Mention[];
  media?: Media[];
}
```

### Mention (Említés)
```typescript
interface Mention {
  id: number;
  userId: number;
  userName: string;
  position: number;              // Karakter pozíció a szövegben
}
```

### Media (Csatolt média)
```typescript
interface Media {
  id: number;
  type: 'image' | 'file';
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
```

---

## Funkciók Részletesen

### Kitűzés (Pin)
- Kapcsolattartó jelölhet ki fontos témákat
- Kitűzött témák mindig felül jelennek meg
- Korlátlan számú kitűzhető

### Zárolás (Lock)
- Kapcsolattartó zárhatja le a beszélgetést
- Zárolt témához nem lehet hozzászólni
- Meglévő hozzászólások láthatók maradnak

### Említések (@mention)
- `@név` formátumban
- Autocomplete a résztvevők között
- Értesítés (jelenleg nincs implementálva!)

### Beágyazott Válaszok
- Maximum 2 szint mélység
- Válasz gomb a hozzászólásokon
- Vizuális behúzás

### Like Rendszer
- Hozzászólások like-olhatók
- Like szám látható
- Saját like visszavonható

### Szerkesztési Időkorlát
- Vendégek 15 percig szerkeszthetik
- Kapcsolattartó bármikor szerkeszthet
- Szerkesztett hozzászólás jelölve

---

## API Endpoint-ok

| Metódus | Endpoint | Leírás |
|---------|----------|--------|
| GET | `/tablo-frontend/discussions` | Beszélgetések listája |
| GET | `/tablo-frontend/discussions/:id` | Beszélgetés részletei |
| POST | `/tablo-frontend/discussions` | Új beszélgetés |
| PUT | `/tablo-frontend/discussions/:id` | Beszélgetés szerkesztése |
| DELETE | `/tablo-frontend/discussions/:id` | Beszélgetés törlése |
| POST | `/tablo-frontend/discussions/:id/pin` | Kitűzés |
| POST | `/tablo-frontend/discussions/:id/unpin` | Kitűzés megszüntetése |
| POST | `/tablo-frontend/discussions/:id/lock` | Zárolás |
| POST | `/tablo-frontend/discussions/:id/unlock` | Zárolás feloldása |
| GET | `/tablo-frontend/discussions/:id/posts` | Hozzászólások |
| POST | `/tablo-frontend/discussions/:id/posts` | Új hozzászólás |
| PUT | `/tablo-frontend/posts/:id` | Hozzászólás szerkesztése |
| DELETE | `/tablo-frontend/posts/:id` | Hozzászólás törlése |
| POST | `/tablo-frontend/posts/:id/like` | Like |
| DELETE | `/tablo-frontend/posts/:id/like` | Like visszavonása |

---

## User Flow-k

### Hozzászólás Írása (Vendég)
```
1. Beszélgetés megnyitása
2. Ha !isLocked:
   - Rich text editor megjelenik
3. Szöveg beírása
4. Opcionális: @mention, média
5. "Küldés" gomb
6. POST /discussions/:id/posts
7. Lista frissítés (optimistic update)
```

### Válasz Írása
```
1. Hozzászóláson "Válasz" gomb
2. Inline editor megnyílik
3. Szöveg beírása
4. POST /discussions/:id/posts (parentId-val)
5. Beágyazott válasz megjelenik
```

### Beszélgetés Létrehozása (Kapcsolattartó)
```
1. "Új téma" gomb
2. create-discussion-dialog megnyílik
3. Cím megadása
4. Opcionális: sablon kapcsolás
5. Kezdő hozzászólás megadása
6. POST /discussions
7. Redirect → új beszélgetés
```

---

## Rich Text Editor

### Támogatott Formázások
- **Félkövér** (Ctrl+B)
- *Dőlt* (Ctrl+I)
- Linkek
- Listák (számozott, felsorolás)
- @említések

### Nem Támogatott
- Képek beágyazása (külön média csatolás)
- Táblázatok
- Kód blokkok

---

## Moderáció

### Kapcsolattartó Jogai
- Bármely hozzászólás törlése
- Beszélgetés zárolása/feloldása
- Kitűzés kezelése
- Beszélgetés törlése

### Automatikus Moderáció
- Jelenleg nincs
- Tervezett: spam szűrés, szólistás szűrés

---

## Teljesítmény

### Lapozás
- Hozzászólások lapozva töltődnek
- 20 hozzászólás/oldal
- Infinite scroll támogatás

### Optimistic Updates
- Like azonnal megjelenik
- Hozzászólás azonnal megjelenik
- Hiba esetén rollback

### Cache
- Beszélgetés lista cache
- Invalidálás új hozzászólásnál

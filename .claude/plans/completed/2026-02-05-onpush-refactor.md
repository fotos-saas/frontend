# OnPush Change Detection Refactor - Chunked Plan

**Státusz:** 🟡 In Progress
**Létrehozva:** 2025-02-05
**Összesen:** 6 task | ✅ 0 kész | ⏳ 6 hátra

---

## 📋 TASK QUEUE

> Claude: Keresd meg az első `[ ]` taskot és azt csináld!
> Ha kész → jelöld `[x]`-szel → STOP → user clear-el → folytatás

### Phase 1: Shared Components

- [ ] **TASK-001:** OnPush - password-strength + offline-banner
  - Fájlok:
    - `src/app/shared/components/password-strength/password-strength.component.ts`
    - `src/app/shared/components/offline-banner/offline-banner.component.ts`
  - Becsült idő: ~15 perc
  - Mit csinálj:
    1. Add hozzá: `changeDetection: ChangeDetectionStrategy.OnPush`
    2. Ellenőrizd: van-e manuális change detection trigger szükség
    3. Ha Observable → async pipe VAGY signal

- [ ] **TASK-002:** OnPush - reaction-picker + base-dialog
  - Fájlok:
    - `src/app/shared/components/reaction-picker/reaction-picker.component.ts`
    - `src/app/shared/components/base-dialog/base-dialog.component.ts`
  - Becsült idő: ~15 perc
  - Mit csinálj: Ugyanaz mint TASK-001

- [ ] **TASK-003:** OnPush - forum-post
  - Fájlok:
    - `src/app/shared/components/forum-post/forum-post.component.ts`
  - Becsült idő: ~10 perc
  - Mit csinálj: Ugyanaz mint TASK-001

### Phase 2: Page Components

- [ ] **TASK-004:** OnPush - session-chooser
  - Fájlok:
    - `src/app/pages/session-chooser/session-chooser.component.ts`
  - Becsült idő: ~15 perc
  - Mit csinálj: OnPush + ellenőrzés

- [ ] **TASK-005:** OnPush - login pages
  - Fájlok:
    - `src/app/pages/share-login/share-login.component.ts`
    - `src/app/pages/preview-login/preview-login.component.ts`
  - Becsült idő: ~15 perc
  - Mit csinálj: OnPush mindkettőre

### Phase 3: Feature Components

- [ ] **TASK-006:** OnPush - contact-editor-modals
  - Fájlok:
    - `src/app/features/partner/components/contact-editor-modal/contact-editor-modal.component.ts`
    - `src/app/features/marketer/components/contact-editor-modal/contact-editor-modal.component.ts`
  - Becsült idő: ~15 perc
  - Mit csinálj: OnPush mindkettőre

---

## 📝 SESSION LOG

_(Claude: Ide írd a session eredményeket!)_

---

## 🎯 COMPLETION CRITERIA

- [ ] Minden 11 komponens OnPush
- [ ] Nincs renderelési hiba
- [ ] Plan → completed/ mappába

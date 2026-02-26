# Tanári Thumbnail Bug — Linked csoport fotó nem jelenik meg

## Probléma

A tanár listában a linked tanárok (ugyanaz a személy több iskolánál) közül csak annál jelenik meg a fotó, akinél az `active_photo_id` be van állítva. A többi linked tanárnál placeholder ikon van.

## Megoldás — 2 fájl módosítás (csak read, nincs DB write)

1. `active_photo_id` van → azt használjuk
2. `active_photo_id` nincs → linked csoportból a legfrissebb `active_photo_id`-t nézzük

### 1. `backend/app/Models/Concerns/HasArchivePhotos.php`

- `$this->active_photo_id` check → `$this->activePhoto` relation check
- `file_exists()` törlés (felesleges, a Spatie getUrl() mindig működik)

### 2. `backend/app/Actions/Partner/ListTeacherArchiveAction.php`

- Paginate után, transform előtt: linked csoport fotóit 1 extra query-vel betöltjük
- `setRelation('activePhoto', ...)` a NULL active_photo_id-jú tanárokra
- N+1 query elkerülése

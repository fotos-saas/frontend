# Chunked Upload Rendszer

## Státusz: IN PROGRESS

## Elkészült
- [x] Backend migráció (`chunked_uploads` tábla)
- [x] Backend model (`ChunkedUpload`)
- [x] Backend config (`chunked-upload.php`)
- [x] Backend Actions (Init, StoreChunk, Complete, Abort)
- [x] Backend FormRequests (Init, StoreChunk, Complete)
- [x] Backend Controller (`PartnerChunkedUploadController`)
- [x] Backend Cleanup Command (`chunked-uploads:cleanup`)
- [x] Backend Route regisztráció + Scheduler
- [x] Frontend Angular service (`ChunkedUploadService`)
- [x] Frontend `PartnerFinalizationService` módosítás (auto-chunked >8MB)
- [x] Frontend Electron handler (`uploadChunked` függvény)
- [x] PHP szintaxis ellenőrzés — OK
- [x] Angular `ng build --production` — OK
- [x] Electron `tsc` — OK
- [ ] Security review (háttérben fut)
- [ ] Code review (háttérben fut)
- [ ] Security/code review javítások
- [ ] Backend deploy + migráció futtatás
- [ ] Electron build + tesztelés
- [ ] Frontend commit + push

## API Endpointok
```
POST   /api/partner/chunked-upload/init
POST   /api/partner/chunked-upload/{uploadId}/chunk
POST   /api/partner/chunked-upload/{uploadId}/complete
GET    /api/partner/chunked-upload/{uploadId}/status
DELETE /api/partner/chunked-upload/{uploadId}
```

## Fájlok
### Backend (új)
- `database/migrations/2026_03_11_120000_create_chunked_uploads_table.php`
- `app/Models/ChunkedUpload.php`
- `config/chunked-upload.php`
- `app/Actions/Partner/InitChunkedUploadAction.php`
- `app/Actions/Partner/StoreChunkAction.php`
- `app/Actions/Partner/CompleteChunkedUploadAction.php`
- `app/Actions/Partner/AbortChunkedUploadAction.php`
- `app/Http/Requests/Api/Partner/InitChunkedUploadRequest.php`
- `app/Http/Requests/Api/Partner/StoreChunkRequest.php`
- `app/Http/Requests/Api/Partner/CompleteChunkedUploadRequest.php`
- `app/Http/Controllers/Api/Partner/PartnerChunkedUploadController.php`
- `app/Console/Commands/CleanExpiredChunkedUploadsCommand.php`

### Backend (módosított)
- `routes/api/partner.php` — chunked-upload route csoport
- `bootstrap/app.php` — scheduler

### Frontend (új)
- `src/app/shared/services/chunked-upload.service.ts`

### Frontend (módosított)
- `electron/handlers/finalizer.handler.ts` — `uploadChunked()` + auto-detect
- `src/app/features/partner/services/partner-finalization.service.ts` — auto-chunked routing

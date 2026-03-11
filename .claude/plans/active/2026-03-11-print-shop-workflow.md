# Nyomdai Felület & Workflow

## Chunk-ok

### Chunk 1: Backend — Nyomda projekt lista + dashboard [DONE]
### Chunk 2: Backend — Kapcsolat kezelés [DONE]
### Chunk 3: Frontend — Nyomda projekt lista [DONE]
### Chunk 4: Frontend — Nyomda dashboard [DONE]
### Chunk 5: Frontend — Fotós beállítások nyomda szekció [DONE]
### Chunk 6: Értesítések (alap kész, nyomda specifikus típusok DONE)

## Teszteléshez
- Fotocenter TabloPartner ID kell
- Pixelgraf nyomda: TabloPartner ID 26, User: info@pixelgraf.hu / password
- partner_connections rekord kell a kettő között

## Chunk 2 részletek (2026-03-11)
### Fotós oldal endpointok:
- GET /api/partner/print-shop-connections
- POST /api/partner/print-shop-connections (throttle:10,1)
- DELETE /api/partner/print-shop-connections/{id}
- GET /api/partner/available-print-shops

### Nyomda oldal endpointok:
- GET /api/print-shop/connections
- GET /api/print-shop/connection-requests
- POST /api/print-shop/connections/{id}/approve
- POST /api/print-shop/connections/{id}/reject
- DELETE /api/print-shop/connections/{id}
- POST /api/print-shop/connections/invite-studio (throttle:10,1)

### Notification típusok:
- connection_requested, connection_approved, connection_rejected

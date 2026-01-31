# Push Notification Stratégia

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Engagement növelés spam nélkül

---

## 📊 Statisztikák (Miért fontos?)

| Metrika | Érték | Forrás |
|---------|-------|--------|
| Push CTR növekedés | +30% | [Elfsight](https://elfsight.com/blog/web-push-notifications-tutorial/) |
| ROI növekedés | +2200% | Industry average |
| App engagement növekedés | +88% | [MoEngage](https://www.moengage.com/learn/push-notification-best-practices/) |
| 1 órán belüli interakció | 40% | User research |
| Uninstall push miatt | 71% | ⚠️ Ha rosszul csinálod! |

**Tanulság:** A push NAGYON hatékony, DE könnyen spam-mé válhat!

---

## 🎯 Push Típusok és Prioritások

### 🔴 AZONNALI (Real-time)
> Fontos, időérzékeny - azonnal küldeni

| Esemény | Üzenet példa |
|---------|--------------|
| Új hirdetmény (fontos) | "📢 Holnap fotózás! Részletek..." |
| @Említés | "💬 @Kovács Peti említett téged" |
| Válasz a hozzászólásodra | "↩️ Nagy Anna válaszolt neked" |

### 🟡 IDŐZÍTETT (Smart timing)
> Fontos, de nem sürgős - okos időzítéssel

| Esemény | Üzenet példa | Mikor küldeni? |
|---------|--------------|----------------|
| Új szavazás | "🗳️ Új szavazás: Sablon választás" | Délután 15:00-17:00 |
| Szavazás lejár (24h) | "⏰ Még 24 óra! Szavazz a sablonra" | Reggel 9:00 |
| Új minták | "🖼️ 4 új minta érkezett!" | Este 18:00-20:00 |

### 🟢 DIGEST (Összefoglaló)
> Nem sürgős - napi/heti összesítés

| Típus | Üzenet példa | Gyakoriság |
|-------|--------------|------------|
| Napi összefoglaló | "📰 Ma: 3 új hozzászólás, 5 szavazat" | Naponta 18:00 |
| Heti összefoglaló | "📊 Heti összefoglaló: 2 szavazás lezárult" | Vasárnap 10:00 |

---

## ⏰ Időzítési Stratégia

### Célcsoport: 18-25 éves diákok

| Időszak | Aktivitás | Push stratégia |
|---------|-----------|----------------|
| 7:00-9:00 | Reggeli készülődés | ❌ Ne zavarj |
| 9:00-12:00 | Iskolában/munkában | 🟡 Csak sürgős |
| 12:00-14:00 | Ebédszünet | ✅ JÓ időpont |
| 14:00-17:00 | Délután aktív | ✅ LEGJOBB időpont |
| 17:00-21:00 | Szabadidő | ✅ JÓ időpont |
| 21:00-23:00 | Pihenés | 🟡 Csak digest |
| 23:00-7:00 | Alvás | ❌ SOHA |

### Célcsoport: Tanárok (40+ év)

| Időszak | Push stratégia |
|---------|----------------|
| 8:00-16:00 | Munkaidő - csak sürgős |
| 16:00-20:00 | ✅ Megfelelő időpont |
| 20:00+ | ❌ Ne zavarj |

---

## 🚫 Anti-Spam Szabályok

### Frekvencia Limitek

| Szabály | Limit |
|---------|-------|
| Max push / nap / user | 3 db |
| Max push / hét / user | 10 db |
| Minimum idő két push között | 2 óra |
| Digest max / hét | 2 db |

### Csoportosítás

```
❌ ROSSZ:
  Push 1: "Kovács Peti szavazott"
  Push 2: "Nagy Anna szavazott"
  Push 3: "Kiss Béla szavazott"

✅ JÓ:
  Push 1: "🗳️ 3 új szavazat érkezett a Sablon választásra"
```

### Intelligens Kihagyás

| Feltétel | Akció |
|----------|-------|
| User online az appban | ❌ Ne küldj push-t |
| User 1 órán belül kapott push-t | ⏰ Várj vagy csoportosíts |
| User kikapcsolta ezt a típust | ❌ Ne küldj |
| User 7 napja inaktív | 📧 Email helyett |

---

## 🔧 Technikai Megvalósítás

### Opció 1: OneSignal (Ajánlott)
**Előnyök:**
- Ingyenes tier (10k subscriber)
- Egyszerű integráció
- iOS + Android + Web
- Beépített analytics
- Segmentation

**Implementáció:**
```javascript
// 1. SDK betöltés
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>

// 2. Inicializálás
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "YOUR-APP-ID",
  });
});

// 3. Push küldés (backend)
POST https://onesignal.com/api/v1/notifications
{
  "app_id": "YOUR-APP-ID",
  "included_segments": ["project_123_users"],
  "headings": {"en": "Új szavazás!"},
  "contents": {"en": "Sablon választás - Szavazz most!"},
  "url": "https://app.tablokiraly.hu/voting/123"
}
```

### Opció 2: Firebase Cloud Messaging (FCM)
**Előnyök:**
- Teljesen ingyenes
- Google infrastruktúra
- Jó dokumentáció

**Hátrányok:**
- Több setup
- Nincs beépített segmentation

---

## 📝 Opt-In Stratégia

### ❌ ROSSZ: Azonnal kérdezni
```
User megnyitja az appot
  ↓
"Engedélyezed az értesítéseket?" ← 60% elutasítás!
```

### ✅ JÓ: Értéket mutatni először

```
User megnyitja az appot
  ↓
User regisztrál / belép
  ↓
User először szavaz
  ↓
"Szeretnéd tudni, mikor zárulnak a szavazások?"
  [Igen, értesíts!] [Később]
  ↓
Native permission kérés
```

### Soft Ask UI

```
┌─────────────────────────────────────────────┐
│                                             │
│  🔔 Maradj naprakész!                       │
│                                             │
│  Értesítünk, ha:                            │
│  • Új szavazás indul                        │
│  • Válaszolnak neked                        │
│  • Fontos hirdetmény jön                    │
│                                             │
│  [Bekapcsolom]        [Most nem]            │
│                                             │
└─────────────────────────────────────────────┘
```

**Mikor jelenjen meg?**
1. Első szavazás után
2. Első hozzászólás után
3. 3. látogatás után

---

## ⚙️ User Beállítások

### Egyszerű Toggle-ök

```
┌─────────────────────────────────────────────┐
│ 🔔 Értesítési beállítások                   │
│ ─────────────────────────────────────────── │
│                                             │
│ Push értesítések          [====●]  BE      │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ Mire értesítselek?                          │
│                                             │
│ ☑️ Új szavazások                            │
│ ☑️ Válaszok és említések                    │
│ ☑️ Fontos hirdetmények                      │
│ ☐ Napi összefoglaló                         │
│                                             │
└─────────────────────────────────────────────┘
```

### Alapértelmezések

| Beállítás | Alapértelmezett |
|-----------|-----------------|
| Új szavazások | ✅ BE |
| Válaszok/említések | ✅ BE |
| Fontos hirdetmények | ✅ BE |
| Napi összefoglaló | ❌ KI |
| Szavazás lejárat emlékeztető | ✅ BE |

---

## 📱 Push Üzenet Formátum

### Struktúra
```
┌─────────────────────────────────────────────┐
│ 📷 Tablókirály                              │  ← App ikon + név
│ ───────────────────────────────────────────│
│ 🗳️ Új szavazás indult!                      │  ← Cím (max 50 kar)
│ Sablon választás - 25 fő szavazhat          │  ← Body (max 100 kar)
│                                  [Megnézem] │  ← CTA gomb
└─────────────────────────────────────────────┘
```

### Üzenet Minták

| Típus | Emoji | Cím | Body |
|-------|-------|-----|------|
| Új szavazás | 🗳️ | Új szavazás indult! | {title} - Szavazz most! |
| Szavazás lejár | ⏰ | Még 24 óra! | {title} - Ne maradj le! |
| Válasz | ↩️ | {name} válaszolt | "{preview}..." |
| Említés | 📣 | {name} említett | a {topic} témában |
| Hirdetmény | 📢 | Fontos üzenet! | {message preview} |
| Új minták | 🖼️ | Új minták érkeztek! | {count} minta vár rád |

---

## 📊 Mérés és Optimalizálás

### KPI-k

| Metrika | Cél | Vészjelzés |
|---------|-----|------------|
| Opt-in rate | >50% | <30% |
| Open rate | >20% | <10% |
| CTR | >5% | <2% |
| Unsubscribe rate | <5%/hó | >10%/hó |

### A/B Tesztelés

Tesztelendő elemek:
1. Emoji vs. nincs emoji
2. Személyes ("Neked") vs. általános
3. Délelőtti vs. délutáni küldés
4. Rövid vs. hosszabb body

---

## 🚀 Implementációs Terv

### Fázis 1: Alap (1-2 nap)
- [ ] OneSignal account + app setup
- [ ] Service worker hozzáadás
- [ ] Alapvető push küldés backend-ről

### Fázis 2: Opt-in (1 nap)
- [ ] Soft ask UI komponens
- [ ] Trigger logika (mikor kérdezzük)
- [ ] Permission kezelés

### Fázis 3: Smart Timing (1-2 nap)
- [ ] Ütemezési logika backend
- [ ] Csoportosítás
- [ ] Frekvencia limitek

### Fázis 4: Beállítások (1 nap)
- [ ] Settings UI
- [ ] User preferences mentése
- [ ] Szűrés push küldésnél

**Összesen: ~5-6 nap**

---

## 📚 Források

- [Push Notification Best Practices 2025](https://upshot-ai.medium.com/push-notifications-best-practices-for-2025-dos-and-don-ts-34f99de4273d)
- [MoEngage - 19 Best Practices](https://www.moengage.com/learn/push-notification-best-practices/)
- [CleverTap - 25 Strategies](https://clevertap.com/blog/push-notification-strategy/)
- [OneSignal Documentation](https://documentation.onesignal.com/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

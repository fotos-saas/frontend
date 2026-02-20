import { ModuleDetailContent } from './module-detail.types';

export const MODULE_DETAIL_CONTENTS: Record<string, ModuleDetailContent> = {

  // ─────────────────────────────────────────────
  // 1. KÉPVÁLASZTÓ
  // ─────────────────────────────────────────────
  kepvalaszto: {
    moduleKey: 'kepvalaszto',
    badge: '⭐ Népszerű',
    heroGradient: 'from-indigo-500',
    benefits: [
      {
        icon: 'image',
        title: 'Szülők maguk választanak',
        description:
          'A szülők saját eszközükről, bármikor és bárhonnan kiválaszthatják gyermekük legjobb képeit — nincs papíros megrendelő, nincs telefonálgatás.',
      },
      {
        icon: 'shield-check',
        title: 'Biztonságos hozzáférés',
        description:
          'Minden galéria egyedi PIN-kóddal vagy QR-kóddal védett, így csak az arra jogosult szülők láthatják a képeket.',
      },
      {
        icon: 'clock',
        title: 'Határidő-kezelés',
        description:
          'Állíts be választási határidőt — a rendszer automatikusan emlékeztet, te pedig pontosan tudod, mikor zárhatod le a megrendeléseket.',
      },
      {
        icon: 'bar-chart-3',
        title: 'Valós idejű statisztika',
        description:
          'Egy pillantással látod, hány szülő választott már képet, ki nem nyitotta meg a galériát, és mikor volt az utolsó aktivitás.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Feltöltöd a képeket',
        description:
          'A fotózás után feltöltöd az elkészített képeket a projektbe. A rendszer automatikusan diákonként rendezi őket.',
      },
      {
        step: 2,
        title: 'Megosztod a galériát',
        description:
          'Egy kattintással generálsz egyedi QR-kódot vagy belépési linket, amit elküldesz a szülőknek e-mailben vagy papíron.',
      },
      {
        step: 3,
        title: 'A szülők kiválasztják a kedvenceket',
        description:
          'A szülő saját mobilján vagy számítógépén megnyitja a galériát, és megjelöli a megrendelni kívánt képeket.',
      },
      {
        step: 4,
        title: 'Te összegyűjtöd az igényeket',
        description:
          'Az összes választás automatikusan összesítve jelenik meg az irányítópulton — készen áll a nyomtatáshoz vagy továbbiközlésre.',
      },
    ],
    features: [
      { text: 'Mobilbarát, reszponzív galéria nézet' },
      { text: 'QR-kód és egyedi PIN-kódos belépés' },
      { text: 'Diánkénti képcsoportosítás automatikusan' },
      { text: 'Kedvencek jelölése egyszerű szívecskével' },
      { text: 'Választási határidő beállítása és megjelenítése' },
      { text: 'Szülői aktivitás nyomon követése' },
      { text: 'Exportálható összesítő a választásokról' },
      { text: 'Többnyelvű felület (magyar, angol)' },
      { text: 'Korlátlan képszám galériánként' },
      { text: 'Integrált emlékeztető rendszer (Poke)' },
    ],
    screenshots: [
      { src: null, alt: 'Szülői galéria nézet mobilon', caption: 'Egyszerű, átlátható galéria szülőknek mobil eszközön' },
      { src: null, alt: 'Választások összesítő irányítópult', caption: 'Valós idejű összesítő — egy pillantással látod az állapotot' },
      { src: null, alt: 'QR-kód generátor', caption: 'Egyedi QR-kód nyomtatható belépőkártyára, körlevélbe' },
    ],
    useCases: [
      {
        icon: 'school',
        persona: 'Iskolai fotós',
        description:
          'Osztályonként külön galériát hoz létre, a szülők QR-kódon lépnek be és jelölik ki a kívánt képeket — a papíros megrendelők megszűnnek.',
      },
      {
        icon: 'camera',
        persona: 'Óvodai fotós',
        description:
          'Az óvoda kinyomtatja a QR-kódokat a faliújságra, a szülők hazafelé menet mobiljukkal azonnal kiválaszthatják a kedvenc pillanatokat.',
      },
      {
        icon: 'building',
        persona: 'Stúdiófotós',
        description:
          'Érettségi fotózás után a végzős diákok önállóan döntenek, melyik képet rendelik meg — a fotós nem telefonál egyenként mindenkivel.',
      },
    ],
    faq: [
      {
        question: 'Kell-e a szülőknek fiókot létrehozniuk a képválasztáshoz?',
        answer:
          'Nem. A szülők PIN-kóddal vagy QR-kóddal lépnek be, nincs szükség regisztrációra. Ez csökkenti a belépési küszöböt és növeli a részvételi arányt.',
      },
      {
        question: 'Mi történik, ha a szülő lejár a határidő után szeretne választani?',
        answer:
          'A galéria lezárása után a belépési link és a QR-kód érvénytelenné válik. A határidőt bármikor meghosszabbíthatod a beállításokban.',
      },
      {
        question: 'Hány kép tölthető fel egy galériába?',
        answer:
          'A képek száma nincs korlátozva — a tárolási keret (csomagtól függően 5–500 GB) a mérlegen. Nagy osztályok esetén is gördülékenyen működik.',
      },
    ],
    relatedModuleKeys: ['webshop', 'advancepay', 'poke', 'ai_face_recognition'],
  },

  // ─────────────────────────────────────────────
  // 2. SABLON KEZELŐ
  // ─────────────────────────────────────────────
  sablonkezelo: {
    moduleKey: 'sablonkezelo',
    badge: null,
    heroGradient: 'from-violet-500',
    benefits: [
      {
        icon: 'layout-template',
        title: 'Professzionális sablonkönyvtár',
        description:
          'Több tucat előre elkészített tablósablon közül választhatsz, amelyeket tetszés szerint személyre szabhatsz saját logóddal és színeiddel.',
      },
      {
        icon: 'hard-drive',
        title: 'Sablon mentése és újrahasználása',
        description:
          'Az egyszer elkészített saját sablont elmented, és a következő fotózásnál egy kattintással alkalmazod — nem kell újrakezdeni.',
      },
      {
        icon: 'users',
        title: 'Rugalmas elrendezések',
        description:
          'Különböző osztálylétszámokhoz automatikusan illeszkedő rácsok: 20, 25, 30 vagy akár 35 diák is elhelyezhető egy táblón.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Tallózol a sablonkönyvtárban',
        description:
          'Az előre elkészített sablonok között tallózsz, előnézetet nézel, majd kiválasztod a projektedhez legjobban illőt.',
      },
      {
        step: 2,
        title: 'Személyre szabod',
        description:
          'Hozzáadod az iskola logóját, beállítod az osztálynevet, az évszámot és a betűtípust — minden elem drag & drop-pal mozgatható.',
      },
      {
        step: 3,
        title: 'Elmented saját sablonként',
        description:
          'Az elkészített dizájnt saját könyvtáradba mented, ahol bármikor visszakeresheted és tovább szerkesztheted.',
      },
    ],
    features: [
      { text: 'Előre elkészített sablonok (A4, A3, panoráma)' },
      { text: 'Drag & drop szerkesztő felület' },
      { text: 'Egyéni logó és szín feltöltése' },
      { text: 'Több betűtípus és tipográfiai opció' },
      { text: 'Automatikus méretillesztés létszám alapján' },
      { text: 'Saját sablonkönyvtár — korlátlan mentés' },
      { text: 'Sablon másolása és változatozása' },
      { text: 'Előnézet nyomtatási méretben' },
    ],
    screenshots: [
      { src: null, alt: 'Sablonkönyvtár böngésző', caption: 'Előre elkészített sablonok categóriánként rendezve' },
      { src: null, alt: 'Sablon szerkesztő felület', caption: 'Vizuális szerkesztő — minden elem kézzel igazítható' },
    ],
    useCases: [
      {
        icon: 'graduation-cap',
        persona: 'Érettségiző osztályok fotósa',
        description:
          'Évente ugyanazzal az iskolával dolgozik, ezért elment egy iskolára szabott sablont — a következő évben csak a képeket cseréli le.',
      },
      {
        icon: 'briefcase',
        persona: 'Több iskolával dolgozó stúdió',
        description:
          'Minden iskolához külön sablont tárol saját logóval és színekkel, így a tablók megjelenése mindig egységes és professzionális.',
      },
    ],
    faq: [
      {
        question: 'Importálhatok saját sablont (PSD, AI)?',
        answer:
          'Jelenleg a szerkesztő saját formátumát használja, de a Tablószerkesztő Desktop modullal Photoshop-alapú munkafolyamat is megvalósítható.',
      },
      {
        question: 'Hány saját sablont tárolhatok?',
        answer:
          'Az Alap csomagban legfeljebb 10 sablon tárolható. Az Iskola és Stúdió csomagban korlátlan számú saját sablon menthető.',
      },
    ],
    relatedModuleKeys: ['tablo_editor_desktop', 'tablo_editor_online', 'kepvalaszto'],
  },

  // ─────────────────────────────────────────────
  // 3. TABLÓSZERKESZTŐ DESKTOP
  // ─────────────────────────────────────────────
  tablo_editor_desktop: {
    moduleKey: 'tablo_editor_desktop',
    badge: '⭐ Népszerű',
    heroGradient: 'from-sky-500',
    benefits: [
      {
        icon: 'monitor',
        title: 'Natív teljesítmény',
        description:
          'Az asztali alkalmazás közvetlenül a gépen fut — nagy felbontású képek is gördülékenyen kezelhetők, nincs böngészős lassulás.',
      },
      {
        icon: 'wand-2',
        title: 'Automatikus képpárosítás',
        description:
          'Az AI vagy a névlista alapján a rendszer automatikusan a megfelelő cellába helyezi a diákok képeit — percek alatt kész az alap tablo.',
      },
      {
        icon: 'layers',
        title: 'Rétegalapú szerkesztés',
        description:
          'Photoshop-szerű rétegkezelés: háttér, képcellák, szöveg és dekorációs elemek külön rétegeken kezelhetők.',
      },
      {
        icon: 'printer',
        title: 'Nyomtatóbarát kimenet',
        description:
          'TIFF, PDF/X és CMYK export nyomdakész minőségben — megfelel a professzionális laborok követelményeinek.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Letöltöd és telepíted az alkalmazást',
        description:
          'A PhotoStack asztali alkalmazást egyszer telepíted Mac vagy Windows gépen, majd az online fiókodhoz kötöd.',
      },
      {
        step: 2,
        title: 'Betöltöd a projektet',
        description:
          'Az online rendszerből egy kattintással betöltöd a projektet a névlistával és a feltöltött képekkel együtt.',
      },
      {
        step: 3,
        title: 'Az AI elrendezi a képeket',
        description:
          'Az arcfelismerés vagy névegyeztetés alapján a rendszer automatikusan a megfelelő cellába helyezi minden diák portréját.',
      },
      {
        step: 4,
        title: 'Exportálod nyomdakész minőségben',
        description:
          'Egy kattintással exportálsz TIFF vagy PDF/X formátumban, 300 DPI felbontással — készen áll a laborba küldésre.',
      },
    ],
    features: [
      { text: 'Mac és Windows natív alkalmazás' },
      { text: 'Rétegalapú szerkesztő (háttér, cellák, szöveg)' },
      { text: 'AI-alapú automatikus képpárosítás' },
      { text: 'Névlista import (Excel, CSV)' },
      { text: 'TIFF, PDF/X, CMYK export' },
      { text: '300 DPI nyomdakész kimenet' },
      { text: 'Photoshop PSD import és export' },
      { text: 'Offline munkavégzés (szinkron feltöltéssel)' },
      { text: 'Batch feldolgozás több osztályhoz egyszerre' },
      { text: 'Beépített javítóecset és korrekció' },
    ],
    screenshots: [
      { src: null, alt: 'Tablószerkesztő Desktop főablak', caption: 'Rétegalapú szerkesztő — professzionális eszközök egyetlen felületen' },
      { src: null, alt: 'AI képpárosítás folyamat', caption: 'Automatikus párosítás: a rendszer percek alatt rendezi el a képeket' },
      { src: null, alt: 'Export beállítások panel', caption: 'Nyomdakész export — TIFF, PDF/X, CMYK egy kattintással' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Profi iskolai fotós',
        description:
          'Évente 30–50 iskolával dolgozik — a Desktop app offline is futtatható, és egy munkafolyamatban több osztály tabloját is elkészíti.',
      },
      {
        icon: 'building-2',
        persona: 'Fotóstúdió operátor',
        description:
          'A stúdió szerkesztői az asztali alkalmazásban dolgoznak nagy teljesítményű munkaállomásokon, míg a menedzser az online irányítópultot figyeli.',
      },
    ],
    faq: [
      {
        question: 'Szükséges-e folyamatos internetkapcsolat a Desktop alkalmazáshoz?',
        answer:
          'Nem. A projekt betöltése után offline is dolgozhatsz. Az exportált fájlokat a szinkron feltöltéssel utólag töltheted fel a rendszerbe.',
      },
      {
        question: 'Mac M-chip (Apple Silicon) kompatibilis az alkalmazás?',
        answer:
          'Igen, az alkalmazás natívan fut Apple Silicon (M1/M2/M3) processzorokon is — gyorsabb renderelés és kisebb energiafelhasználás mellett.',
      },
    ],
    relatedModuleKeys: ['sablonkezelo', 'tablo_editor_online', 'ai_face_recognition', 'ai_crop'],
  },

  // ─────────────────────────────────────────────
  // 4. TABLÓSZERKESZTŐ ONLINE
  // ─────────────────────────────────────────────
  tablo_editor_online: {
    moduleKey: 'tablo_editor_online',
    badge: '🆕 Új',
    heroGradient: 'from-cyan-500',
    benefits: [
      {
        icon: 'globe',
        title: 'Bármely eszközről elérhető',
        description:
          'Nincs telepítés — a tablószerkesztő böngészőből fut, legyen az Mac, Windows, iPad vagy akár Chromebook.',
      },
      {
        icon: 'users',
        title: 'Együttműködés valós időben',
        description:
          'Több szerkesztő dolgozhat egyszerre ugyanazon a projekten — ütközések nélkül, valós idejű szinkronizációval.',
      },
      {
        icon: 'sparkles',
        title: 'Ugyanazok az AI funkciók',
        description:
          'Az automatikus képpárosítás, AI crop és arcfelismerés ugyanúgy elérhető böngészőből, mint az asztali alkalmazásban.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Megnyitod a projektet a böngészőben',
        description:
          'Bejelentkezés után kiválasztod a projektet, és az Online szerkesztő azonnal betölti a képeket és a sablont.',
      },
      {
        step: 2,
        title: 'Elrendezed és szerkeszted a tablót',
        description:
          'Ugyanazokat az eszközöket használod, mint a Desktop változatban — drag & drop, szövegszerkesztés, AI párosítás.',
      },
      {
        step: 3,
        title: 'Exportálod vagy megosztod',
        description:
          'A kész tablót exportálod, vagy megosztod egy belső előnézeti linkkel ellenőrzésre, mielőtt nyomdába küldöd.',
      },
    ],
    features: [
      { text: 'Böngészőalapú — telepítés nélkül' },
      { text: 'Valós idejű többfelhasználós szerkesztés' },
      { text: 'AI-alapú automatikus képpárosítás' },
      { text: 'Ugyanazok a sablonok, mint a Desktop változatban' },
      { text: 'Belső előnézeti link megosztáshoz' },
      { text: 'Automatikus mentés minden változtatásnál' },
      { text: 'Verzióhistória — visszaállítás bármely korábbi állapotba' },
      { text: 'Exportálás PDF és PNG formátumban' },
    ],
    screenshots: [
      { src: null, alt: 'Online szerkesztő böngészőben', caption: 'Teljes értékű szerkesztő — közvetlenül a böngészőből, telepítés nélkül' },
      { src: null, alt: 'Többfelhasználós szerkesztés jelzői', caption: 'Valós idejű együttműködés — látod, ki mit szerkeszt éppen' },
    ],
    useCases: [
      {
        icon: 'briefcase',
        persona: 'Fotós asszisztens',
        description:
          'Az asszisztens saját laptopján böngészőből rendezi el a képeket, miközben a főfotós helyszínen dolgozik — nincs fájlmásolgatás.',
      },
      {
        icon: 'school',
        persona: 'Kis stúdió, egyetlen gép nélkül',
        description:
          'Nincs dedikált szerkesztő munkaállomás — az Online szerkesztő irodai laptopon is tökéletesen fut, mint egy webalkalmazás.',
      },
    ],
    faq: [
      {
        question: 'Megköveteli a Tablószerkesztő Online a Desktop modul meglétét?',
        answer:
          'Igen, az Online szerkesztő a Desktop modult igényli alapként — a két verzió azonos motor fölött fut, az Online kiegészítő jellegű.',
      },
      {
        question: 'Milyen böngészők támogatottak?',
        answer:
          'Chrome, Firefox, Safari (14+) és Edge legfrissebb verziói teljes mértékben támogatottak. Internet Explorer nem támogatott.',
      },
    ],
    relatedModuleKeys: ['tablo_editor_desktop', 'sablonkezelo', 'ai_face_recognition'],
  },

  // ─────────────────────────────────────────────
  // 5. WEBSHOP
  // ─────────────────────────────────────────────
  webshop: {
    moduleKey: 'webshop',
    badge: '⭐ Népszerű',
    heroGradient: 'from-emerald-500',
    benefits: [
      {
        icon: 'shopping-cart',
        title: 'Integrált online értékesítés',
        description:
          'A szülők közvetlenül a galériából rendelnek és fizetnek — nincs cash gyűjtés, nincs adminisztrációs teher, a pénz automatikusan megérkezik.',
      },
      {
        icon: 'receipt',
        title: 'Automatikus számlázás',
        description:
          'Minden sikeres rendeléshez automatikusan elkészül a számla, amit a rendszer e-mailben küld a vevőnek — nincs manuális könyvelés.',
      },
      {
        icon: 'truck',
        title: 'Rugalmas szállítási lehetőségek',
        description:
          'Házhozszállítás, iskolai átvétel vagy digitális letöltés — te döntöd el, milyen opciókat kínálsz a szülőknek.',
      },
      {
        icon: 'bar-chart-3',
        title: 'Valós idejű forgalmi kimutatás',
        description:
          'Részletes értékesítési riport: mely képek fogynak legjobban, mekkora a bevétel iskolánként, melyik osztály adott le legtöbb rendelést.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Beállítod a termékeket és árakat',
        description:
          'Meghatározod az elérhető méreteket (pl. 10×15 cm, A4, tablófotó) és az árakat — a rendszer automatikusan megmutatja a szülőknek.',
      },
      {
        step: 2,
        title: 'A szülők a galériából rendelnek',
        description:
          'A szülő a Képválasztóban kijelöli a kívánt képeket, hozzáadja a kosárhoz, kiválasztja a méretet és online fizet.',
      },
      {
        step: 3,
        title: 'Összegyűjtöd és teljesíted a rendeléseket',
        description:
          'Az összes beérkező megrendelés egy helyen jelenik meg — nyomtatható összesítővel a laborba küldéshez.',
      },
      {
        step: 4,
        title: 'Szállítod vagy átadod a képeket',
        description:
          'Házhozszállítás esetén a rendszer generálja a szállítóleveleket. Iskolai átadásnál osztályonkénti csomagoló listát kapsz.',
      },
    ],
    features: [
      { text: 'Online kártyás és banki átutalásos fizetés' },
      { text: 'Automatikus számla generálás (PDF)' },
      { text: 'Termékek és méretvariációk kezelése' },
      { text: 'Kosár és checkout flow beépítve' },
      { text: 'Házhozszállítás és iskolai átvétel opció' },
      { text: 'Rendelés-státusz követés szülőknek' },
      { text: 'Exportálható megrendelési listák laborhoz' },
      { text: 'Promóciós kuponkódok kezelése' },
      { text: 'Részletes bevételi és forgalmi riportok' },
      { text: 'Mobilbarát checkout felület' },
    ],
    screenshots: [
      { src: null, alt: 'Szülői webshop kosár nézet', caption: 'Egyszerű, mobilbarát kosár — kiválasztás és fizetés 3 lépésben' },
      { src: null, alt: 'Rendelések összesítő irányítópult', caption: 'Minden rendelés egy helyen — nyomtatható labor-összesítővel' },
      { src: null, alt: 'Bevételi riport grafikon', caption: 'Részletes bevételi elemzés iskolánként és időszakonként' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Iskolai fotós vállalkozó',
        description:
          'Szeptembertől júniusig folyamatosan érkeznek a rendelések — a webshop automatán kezeli a fizetést, ő csak a teljesítésre koncentrál.',
      },
      {
        icon: 'store',
        persona: 'Fotóstúdió több iskolával',
        description:
          'Minden iskolának saját galériája és webshopja van, de a bevétel és a rendelések egy egységes irányítópulton összegzódnek.',
      },
    ],
    faq: [
      {
        question: 'Milyen fizetési módokat fogad el a webshop?',
        answer:
          'Bankkártyás fizetést (Visa, Mastercard), SimplePay és Stripe integrációt támogatunk. Banki átutalás is lehetséges, manuális jóváhagyással.',
      },
      {
        question: 'A webshop valóban automatikusan állítja ki a számlát?',
        answer:
          'Igen. Minden sikeres rendelés után a rendszer automatikusan elkészíti és e-mailben elküldi az elektronikus számlát a vevőnek.',
      },
      {
        question: 'Tudok promóciós kedvezményt adni egy iskolának?',
        answer:
          'Igen. Iskolánként egyedi kuponkódot generálhatsz meghatározott százalékos vagy forintos kedvezménnyel, és lejárati dátummal.',
      },
    ],
    relatedModuleKeys: ['kepvalaszto', 'advancepay', 'digital_downloads', 'email_notifications'],
  },

  // ─────────────────────────────────────────────
  // 6. ADVANCEPAY
  // ─────────────────────────────────────────────
  advancepay: {
    moduleKey: 'advancepay',
    badge: '⭐ Népszerű',
    heroGradient: 'from-amber-500',
    benefits: [
      {
        icon: 'banknote',
        title: 'Előleggyűjtés a fotózás előtt',
        description:
          'A szülők online fizetik be az előleget még a fotózás napja előtt — nincs helyszíni pénzkezelés, nincs aprópénz zűrzavar.',
      },
      {
        icon: 'check-circle',
        title: 'Magasabb részvételi arány',
        description:
          'Az előlegfizető szülők elkötelezettebbek — a lemondások száma és a "megfeledkezők" aránya jelentősen csökken.',
      },
      {
        icon: 'shield-check',
        title: 'Biztonságos pénzügyi tervezés',
        description:
          'Tudod előre, hány diák fizet, így pontosan kalkulálhatsz nyomtatási mennyiséget és laborköltséget.',
      },
      {
        icon: 'calendar',
        title: 'Automatikus emlékeztetők',
        description:
          'A rendszer automatikusan emlékezteti a nem fizetőket a határidő közeledtével — neked nem kell egyesével üzengetni.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Beállítod az előleg összegét és határidejét',
        description:
          'Meghatározod az előleg mértékét (összeg vagy százalék) és a befizetési határidőt — a rendszer elvégzi a többit.',
      },
      {
        step: 2,
        title: 'A szülők értesítést kapnak',
        description:
          'Automatikus e-mail és/vagy SMS értesítés megy ki az AdvancePay linkkel — a szülők kártyájukkal fizetnek.',
      },
      {
        step: 3,
        title: 'Nyomon követed a befizetéseket',
        description:
          'Az irányítópulton osztályonként és diákonként látod, ki fizetett és ki nem — exportálható lista a fizetési igazolásokhoz.',
      },
    ],
    features: [
      { text: 'Online kártyás előlegfizetés' },
      { text: 'Összeg- és százalékalapú előleg beállítás' },
      { text: 'Automatikus emlékeztető e-mail és SMS' },
      { text: 'Osztályonkénti és projekt szintű összesítő' },
      { text: 'Befizetési igazolás automatikus küldése' },
      { text: 'Exportálható fizetési lista iskolánként' },
      { text: 'Visszatérítés kezelése egyedi esetekben' },
      { text: 'Integrált a Képválasztó modullal' },
    ],
    screenshots: [
      { src: null, alt: 'AdvancePay szülői fizető oldal', caption: 'Egyszerű fizető felület — a szülő percek alatt kifizeti az előleget' },
      { src: null, alt: 'Befizetések összesítő', caption: 'Osztályonkénti befizetési lista — exportálható PDF-ben vagy Excelben' },
    ],
    useCases: [
      {
        icon: 'graduation-cap',
        persona: 'Érettségi tablófotós',
        description:
          'A végzős osztály szülei előre fizetik a tablo árát — a fotós biztos bevétellel tervez, nincs kintlévőség a leadás után.',
      },
      {
        icon: 'school',
        persona: 'Iskolai megrendelések koordinátora',
        description:
          'Az iskolatitkár nem kezeli a készpénzt — az előlegek online érkeznek be, ő csak az összesítőt nyomtatja ki ellenőrzésre.',
      },
    ],
    faq: [
      {
        question: 'Mi történik, ha a szülő nem fizeti be az előleget a határidőig?',
        answer:
          'A rendszer automatikusan küld emlékeztetőket. Ha lejár a határidő, a fotós manuálisan dönthet: meghosszabbítja a határidőt vagy lezárja a lehetőséget.',
      },
      {
        question: 'Hogyan történik az előleg elszámolása a végső rendeléssel?',
        answer:
          'A befizetett előleg jóváírásként jelenik meg — a szülő a webshopban a fennmaradó összeget fizeti csak ki a megrendeléskor.',
      },
    ],
    relatedModuleKeys: ['kepvalaszto', 'webshop', 'sms_notifications', 'poke'],
  },

  // ─────────────────────────────────────────────
  // 7. DIGITÁLIS LETÖLTÉSEK
  // ─────────────────────────────────────────────
  digital_downloads: {
    moduleKey: 'digital_downloads',
    badge: '🆕 Új',
    heroGradient: 'from-teal-500',
    benefits: [
      {
        icon: 'download',
        title: 'Azonnali kiszállítás',
        description:
          'A szülő fizet, és azonnal letöltheti a képet — nincs várakozás laborra, nincs postázás, nincs helyszíni átadás.',
      },
      {
        icon: 'hard-drive',
        title: 'Magas felbontású digitális fájlok',
        description:
          'A szülők nyomtatható minőségű, tömörítetlen JPEG vagy TIFF fájlokat kapnak — otthon vagy bármely fotólabban kinyomtathatják.',
      },
      {
        icon: 'key',
        title: 'Biztonságos, egyszer használatos letöltési link',
        description:
          'Minden megvásárolt képhez egyedi, lejárati idős letöltési link generálódik — jogosulatlan megosztás ellen véd.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Engedélyezed a digitális letöltést a projektben',
        description:
          'A projekt beállításaiban bekapcsolod a digitális értékesítést és megadod az egységárat (pl. 500 Ft/kép).',
      },
      {
        step: 2,
        title: 'A szülő a galériából vásárol',
        description:
          'A szülő kiválasztja a kívánt képeket, online fizet, majd automatikusan e-mailben megkapja a letöltési linkeket.',
      },
      {
        step: 3,
        title: 'A fájlok automatikusan letölthetők',
        description:
          'A szülő a biztonságos linken keresztül letölti a képeket — a fotóstól semmilyen manuális lépés nem szükséges.',
      },
    ],
    features: [
      { text: 'Azonnali fizetés utáni letöltés' },
      { text: 'Egyedi, lejárati idős letöltési linkek' },
      { text: 'JPEG és TIFF formátum támogatás' },
      { text: 'Egyedi ár beállítható képenként vagy csomagban' },
      { text: 'Automatikus e-mail a letöltési linkekkel' },
      { text: 'Letöltési statisztika és riport' },
      { text: 'Vízjelezés opció a próbaképekre' },
      { text: 'Letöltési korlátozás (pl. max 3 letöltés)' },
    ],
    screenshots: [
      { src: null, alt: 'Digitális letöltési oldal', caption: 'Letöltési oldal — a szülő egyetlen kattintással menti el a képet' },
      { src: null, alt: 'Letöltési statisztika', caption: 'Látod, ki töltötte le és mikor — linkek státusza valós időben' },
    ],
    useCases: [
      {
        icon: 'user',
        persona: 'Portré- és iskolafotós',
        description:
          'A fizikai nyomtatás mellett digitális fájlt is árul — extra bevételi forrás anélkül, hogy bármit el kellene postáznia.',
      },
      {
        icon: 'graduation-cap',
        persona: 'Érettségi fotós',
        description:
          'A végzős diákok digitálisan vásárolják meg az egyedi portréjukat — azonnal feltehetik közösségi médiára.',
      },
    ],
    faq: [
      {
        question: 'Meddig érvényesek a letöltési linkek?',
        answer:
          'Alapértelmezés szerint 30 napig, de ez a projekt beállításaiban módosítható. Lejárat után a szülő újraigényelhet linket az ügyfélszolgálaton.',
      },
      {
        question: 'Megakadályozható, hogy a szülők továbbosztogassák a linket?',
        answer:
          'A linkek egyszerhasználatosak vagy letöltési limittel korlátozhatók. Ez nem nyújt teljes védelmet, de jelentősen csökkenti a jogosulatlan megosztást.',
      },
    ],
    relatedModuleKeys: ['kepvalaszto', 'webshop', 'email_notifications'],
  },

  // ─────────────────────────────────────────────
  // 8. EMAIL ÉRTESÍTÉSEK
  // ─────────────────────────────────────────────
  email_notifications: {
    moduleKey: 'email_notifications',
    badge: '✨ Ingyenes',
    heroGradient: 'from-blue-500',
    benefits: [
      {
        icon: 'mail',
        title: 'Automatikus kommunikáció',
        description:
          'A rendszer automatikusan küldi ki a megfelelő értesítést a megfelelő időben — neked nem kell manuálisan e-mailezni a szülőknek.',
      },
      {
        icon: 'bell',
        title: 'Személyre szabott sablonok',
        description:
          'Saját arculathoz igazított e-mail sablonok: logó, szín, aláírás — minden kiküldött e-mail a te márkádat tükrözi.',
      },
      {
        icon: 'check-circle',
        title: 'Kézbesítés-nyomonkövetés',
        description:
          'Látod, melyik e-mail érkezett meg, melyiket nyitották meg a szülők — és melyik e-mail cím érvénytelen.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Beállítod a sablonokat',
        description:
          'Az előre elkészített e-mail sablonokat személyre szabod: logó, megszólítás, aláírás — egyszer beállítod, aztán automatikusan megy minden.',
      },
      {
        step: 2,
        title: 'A rendszer automatikusan küld',
        description:
          'Galéria megnyitáskor, határidő közeledtekor, rendelés visszaigazolásakor és számlakiállításkor a rendszer automatikusan elküldi a megfelelő e-mailt.',
      },
      {
        step: 3,
        title: 'Ellenőrzöd a kézbesítési statisztikát',
        description:
          'Az irányítópulton látod a megnyitási arányokat, a kézbesítési hibákat és az érvénytelen e-mail címeket.',
      },
    ],
    features: [
      { text: 'Automatikus galéria-megnyitó értesítő' },
      { text: 'Határidő-emlékeztető e-mail' },
      { text: 'Rendelés-visszaigazoló e-mail' },
      { text: 'Számlakézbesítő e-mail' },
      { text: 'Személyre szabható HTML e-mail sablonok' },
      { text: 'Saját logó és arculat beépítése' },
      { text: 'Kézbesítési és megnyitási statisztika' },
      { text: 'Érvénytelen cím jelzése' },
      { text: 'Tömeges kiküldés osztályonként' },
    ],
    screenshots: [
      { src: null, alt: 'E-mail sablon szerkesztő', caption: 'Vizuális sablon szerkesztő — a kiküldött e-mailek tükrözik a márkádat' },
      { src: null, alt: 'Kézbesítési statisztika', caption: 'Megnyitási arányok és kézbesítési hibák egy pillantással' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Egyéni fotós vállalkozó',
        description:
          'A fotózás után egyetlen gombnyomással értesíti az összes szülőt — nem kell egyenként e-mailezni vagy a szülői e-mail listát kezelni.',
      },
      {
        icon: 'building',
        persona: 'Fotóstúdió adminisztrátora',
        description:
          'Az adminisztrátor beállítja az éves sablonokat — az összes projekt értesítési e-mailje automatikusan egységes arculattal megy ki.',
      },
    ],
    faq: [
      {
        question: 'Tényleg ingyenes az Email Értesítések modul?',
        answer:
          'Igen, az alapvető automatikus értesítők (galéria nyitás, rendelés visszaigazoló, számla) ingyenesek minden csomagnál. A marketingkampányokhoz az Email Marketing modul szükséges.',
      },
      {
        question: 'Saját e-mail domain-ről mehetnek ki az e-mailek?',
        answer:
          'Igen. Az Iskola és Stúdió csomagokban egyedi feladói nevet és domain-t állíthatsz be, így az e-mailek a saját vállalkozásod nevéből érkeznek.',
      },
    ],
    relatedModuleKeys: ['sms_notifications', 'poke', 'email_marketing', 'kepvalaszto'],
  },

  // ─────────────────────────────────────────────
  // 9. SMS ÉRTESÍTÉSEK
  // ─────────────────────────────────────────────
  sms_notifications: {
    moduleKey: 'sms_notifications',
    badge: null,
    heroGradient: 'from-orange-500',
    benefits: [
      {
        icon: 'smartphone',
        title: 'Azonnali elérés',
        description:
          'Az SMS-eket a szülők 98%-a megnyitja — sokkal magasabb elérettség, mint az e-mailnél, különösen idős szülők esetén.',
      },
      {
        icon: 'bell',
        title: 'Határidő előtti emlékeztetők',
        description:
          'Automatikus SMS a galéria lezárása előtt 48 és 24 órával — drasztikusan csökkenti az elmulasztott választások számát.',
      },
      {
        icon: 'check-circle',
        title: 'Rövid, hatékony üzenetek',
        description:
          'Az SMS sablonok tömörre méretezve, egyértelmű cselekvésre szólítanak fel — a szülő azonnal tudja, mi a teendő.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Megadod a szülők telefonszámait',
        description:
          'Importálod a telefonszámokat Excel fájlból vagy manuálisan viszed fel osztályonként — az ékezetek és formátumok automatikusan normalizálódnak.',
      },
      {
        step: 2,
        title: 'Beállítod az SMS eseményeket',
        description:
          'Meghatározod, mikor menjen SMS: galéria megnyitáskor, határidő előtt 2 nappal és 1 nappal, vagy egyedi ütemezéssel.',
      },
      {
        step: 3,
        title: 'A rendszer automatikusan küldi',
        description:
          'Az SMS-ek az ütemezés szerint automatikusan mennek — te csak a statisztikát nézed, hány szülő nyitotta meg a galériát utána.',
      },
    ],
    features: [
      { text: 'Automatikus SMS galéria nyitáskor' },
      { text: 'Határidő-emlékeztető SMS (48h és 24h)' },
      { text: 'Rendelés-visszaigazoló SMS' },
      { text: 'Egyedi SMS sablonok szerkesztése' },
      { text: 'Tömeges kiküldés osztályonként' },
      { text: 'Kézbesítési státusz követés' },
      { text: 'Excel import a telefonszámokhoz' },
      { text: 'Kreditalalapú díjazás (csak elküldött SMS fizeted)' },
    ],
    screenshots: [
      { src: null, alt: 'SMS sablon szerkesztő', caption: 'Rövid, hatékony SMS sablonok — személyre szabható mezőkkel' },
      { src: null, alt: 'SMS kézbesítési státusz', caption: 'Látod, melyik szám érvényes és melyik SMS érkezett meg' },
    ],
    useCases: [
      {
        icon: 'school',
        persona: 'Iskolai fotós, vegyes szülői kör',
        description:
          'Az idős nagyszülők nem olvassák az e-maileket — az SMS garantálja, hogy mindenki időben értesül és visszaigazol.',
      },
      {
        icon: 'camera',
        persona: 'Sportrendezvény fotósa',
        description:
          'A szülők a sportpályán kapják az SMS-t, és a meccsen mobiljukon rögtön megnézik a gyermekükről készített képeket.',
      },
    ],
    faq: [
      {
        question: 'Mennyibe kerül egy SMS?',
        answer:
          'Az SMS-ek kredit alapon működnek — egy hazai SMS küldése 10–15 Ft (az aktuális díjat a fiókod SMS kredit szekciójában találod). Az 1490 Ft/hó havidíj az SMS krediteket NEM tartalmazza.',
      },
      {
        question: 'Küldhetők-e külföldi számokra SMS-ek?',
        answer:
          'Igen, EU-s és legtöbb nemzetközi szám támogatott, de a díjszabás eltérő. Külföldön élő szülők esetén az e-mail értesítés az ajánlott megoldás.',
      },
    ],
    relatedModuleKeys: ['email_notifications', 'poke', 'kepvalaszto', 'advancepay'],
  },

  // ─────────────────────────────────────────────
  // 10. EMAIL MARKETING
  // ─────────────────────────────────────────────
  email_marketing: {
    moduleKey: 'email_marketing',
    badge: '🆕 Új',
    heroGradient: 'from-pink-500',
    benefits: [
      {
        icon: 'mail',
        title: 'Célzott kampányok iskolánként',
        description:
          'Küldj tematikus e-maileket az összes szülőnek, egy adott iskolának vagy egy konkrét osztálynak — szegmentáltan és személyesen.',
      },
      {
        icon: 'bar-chart-3',
        title: 'Megnyitási és kattintási statisztika',
        description:
          'Valós idejű riport mutatja, hány szülő nyitotta meg az e-mailt, melyik link volt a legnépszerűbb, és hány leiratkozó volt.',
      },
      {
        icon: 'palette',
        title: 'Vizuális e-mail szerkesztő',
        description:
          'Drag & drop vizuális szerkesztővel készíthetsz professzionális e-mail newslettereket kódolás nélkül — képekkel, gombokkal, fejléccel.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Kiválasztod a célközönséget',
        description:
          'Meghatározod, kik kapják a kampánylevelet: az összes szülő, egy iskola szülői közössége, vagy egy konkrét osztály.',
      },
      {
        step: 2,
        title: 'Összeállítod az e-mailt',
        description:
          'A vizuális szerkesztőben elkészíted az e-mailt — képek, szöveg, gomb, lábléc — vagy egy előre elkészített sablonból indulsz ki.',
      },
      {
        step: 3,
        title: 'Ütemezed vagy azonnal küldöd',
        description:
          'Választhatsz azonnali küldés vagy jövőbeni időpont közt — a rendszer a megadott időpontban automatikusan kiküldi a kampányt.',
      },
    ],
    features: [
      { text: 'Drag & drop vizuális e-mail szerkesztő' },
      { text: 'Szegmentálás iskolánként és osztályonként' },
      { text: 'Azonnali és ütemezett küldés' },
      { text: 'Megnyitási és kattintási statisztika' },
      { text: 'A/B tesztelés két tárgymezőre' },
      { text: 'Leiratkozás kezelés (GDPR kompatibilis)' },
      { text: 'Kampánykönyvtár — régi kampányok másolása' },
      { text: 'Spam pontszám ellenőrzés küldés előtt' },
    ],
    screenshots: [
      { src: null, alt: 'E-mail kampány szerkesztő', caption: 'Vizuális szerkesztő — professzionális e-mail kódolás nélkül' },
      { src: null, alt: 'Kampánystatisztika riport', caption: 'Megnyitási arányok, kattintások, leiratkozók — egy helyen' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Szezon végén összefoglaló küldő fotós',
        description:
          'Tanév végén köszönő levelet küld az összes szülőnek az elvégzett munkáról, és belerakja a következő szezon ajánlatát.',
      },
      {
        icon: 'building-2',
        persona: 'Fotóstúdió marketing koordinátora',
        description:
          'Havonta kiküld egy newslettert az aktuális akciókról, újdonságokról és a szezon következő fotózási időpontjairól.',
      },
    ],
    faq: [
      {
        question: 'Hány e-mailt küldhetek el havonta?',
        answer:
          'Az 1990 Ft/hó csomagban havi 5000 kiküldött e-mail szerepel. Fölötte kredit vásárlással bővíthető a keret. A limitet az irányítópulton követheted.',
      },
      {
        question: 'GDPR szempontból megfelelő a leiratkoztatás kezelése?',
        answer:
          'Igen. Minden kiküldött kampányban kötelező leiratkozási link szerepel. A leiratkozók automatikusan kizárásra kerülnek a jövőbeni küldésekből.',
      },
    ],
    relatedModuleKeys: ['email_notifications', 'sms_notifications', 'kepvalaszto', 'poke'],
  },

  // ─────────────────────────────────────────────
  // 11. POKE
  // ─────────────────────────────────────────────
  poke: {
    moduleKey: 'poke',
    badge: '✨ Ingyenes',
    heroGradient: 'from-lime-500',
    benefits: [
      {
        icon: 'hand',
        title: 'Szelíd emlékeztetés egyetlen kattintással',
        description:
          'Ha egy szülő nem nyitotta meg a galériát, egy „lökéssel" emlékezteted — nem zavaró, de hatékony módon.',
      },
      {
        icon: 'clock',
        title: 'Automatikus vagy manuális küldés',
        description:
          'Beállíthatod, hogy a rendszer automatikusan lökje meg a nem válaszolókat, vagy te döntöd el manuálisan, kit és mikor.',
      },
      {
        icon: 'check-circle',
        title: 'Megnyitási arány drámai javulása',
        description:
          'Tapasztalataink szerint a Poke funkció használatával 40–60%-kal nő azok aránya, akik időben elvégzik a képválasztást.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Látod, ki nem nyitotta meg a galériát',
        description:
          'Az irányítópulton piros jelzéssel látod, mely szülők még nem tekintették meg a galériát — osztályonkénti bontásban.',
      },
      {
        step: 2,
        title: 'Elküldöd a Poke-ot',
        description:
          'Kijelölöd a nem reagálókat, és egy kattintással elküldöd az emlékeztető e-mailt vagy push értesítést.',
      },
      {
        step: 3,
        title: 'A szülő rögtön visszajelzést kap',
        description:
          'A szülő kap egy barátságos emlékeztetőt a galériáról — a nyitási arány általában 24 órán belül javul.',
      },
    ],
    features: [
      { text: 'Manuális Poke egyedi szülőknek' },
      { text: 'Tömeges Poke az összes nem reagálónak' },
      { text: 'Automatikus Poke ütemezés határidő előtt' },
      { text: 'E-mail és push értesítés csatorna' },
      { text: 'Poke-történet — látod, mikor küldtél utoljára' },
      { text: 'Osztályonkénti reagálási statisztika' },
      { text: 'Teljesen ingyenes minden csomagban' },
    ],
    screenshots: [
      { src: null, alt: 'Poke irányítópult', caption: 'Kik nem nyitották meg? — egy pillantással látod, és azonnal lökésre van lehetőség' },
      { src: null, alt: 'Poke küldés felület', caption: 'Egyetlen kattintás — az emlékeztető azonnal ki is megy' },
    ],
    useCases: [
      {
        icon: 'school',
        persona: 'Osztályfőnök / iskolai koordinátor',
        description:
          'A koordinátor látja a határidő előtt 2 nappal, hogy az osztály 30%-a még nem választott képet — egy kattintással emlékezteti őket.',
      },
      {
        icon: 'camera',
        persona: 'Fotós a lezárás előtt',
        description:
          'A fotós a galéria lezárása előtt egy tömeges Poke-kal eléri, hogy a kapacitás 90% fölött teljesüljön, ne maradjon kép választatlanul.',
      },
    ],
    faq: [
      {
        question: 'Hány Poke-ot küldhetek el naponta?',
        answer:
          'Nincs napi limit a Poke-ok számára. Azonban javasolt nem túl sűrűn küldeni — a rendszer figyelmeztet, ha 24 órán belül már küldtél egy szülőnek.',
      },
      {
        question: 'Tudja a szülő, hogy „lökték"?',
        answer:
          'Igen, de baráti módon. Az e-mail/értesítés szövege úgy van megfogalmazva, hogy emlékeztetőnek, ne nyomásgyakorlásnak érzékelje. A szöveget te is testre szabhatod.',
      },
    ],
    relatedModuleKeys: ['kepvalaszto', 'email_notifications', 'sms_notifications', 'advancepay'],
  },

  // ─────────────────────────────────────────────
  // 12. AI ARCFELISMERÉS
  // ─────────────────────────────────────────────
  ai_face_recognition: {
    moduleKey: 'ai_face_recognition',
    badge: '⭐ Népszerű',
    heroGradient: 'from-rose-500',
    benefits: [
      {
        icon: 'scan-face',
        title: 'Automatikus képrendezés diákonként',
        description:
          'Az AI minden képen azonosítja a szereplőket, és automatikusan az adott diák mappájába rendezi a fotókat — ez korábban órákat vett igénybe.',
      },
      {
        icon: 'sparkles',
        title: 'Magas pontosság',
        description:
          'A modell 95%+ pontossággal ismeri fel az arcokat, még tömegképeken, rossz megvilágításban vagy részben takart arcokon is.',
      },
      {
        icon: 'clock',
        title: 'Több száz kép rendezése percek alatt',
        description:
          'Ami kézzel 2–3 óra lenne, az AI 5–10 perc alatt elvégzi — azonnal utána lehet menni a galérianyitásnak.',
      },
      {
        icon: 'shield-check',
        title: 'GDPR-barát arcadat-kezelés',
        description:
          'Az arcvonásokat kizárólag a szortírozáshoz használjuk, tároljuk — a feldolgozás után az adatok nem kerülnek harmadik félhez.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Feltöltöd a csoportképet és a portrékat',
        description:
          'Feltöltöd az összes elkészített képet — egyéni portrékat és csoportfotókat egyaránt. Az AI mindent egyszerre dolgoz fel.',
      },
      {
        step: 2,
        title: 'Az AI azonosítja az arcokat',
        description:
          'A rendszer automatikusan felismeri az arcokat és diákonként csoportosítja a képeket — a névlistával összevetve azonosítja a személyeket.',
      },
      {
        step: 3,
        title: 'Ellenőrzöd és jóváhagyod',
        description:
          'A rendszer megmutatja a bizonytalan eseteket (alacsony biztonság), amelyeket te manuálisan javíthatsz — a megbízható találatok automatikusan érvényesülnek.',
      },
      {
        step: 4,
        title: 'A szülők csak a saját gyermekük képeit látják',
        description:
          'A rendezett galéria automatikusan diákonkénti szekciókra osztva jelenik meg — minden szülő csak a saját gyermekének fotóit látja.',
      },
    ],
    features: [
      { text: '95%+ arcfelismerési pontosság' },
      { text: 'Csoportkép és egyéni portré egyaránt támogatott' },
      { text: 'Névlistával összekötött automatikus azonosítás' },
      { text: 'Bizonytalan egyezések manuális jóváhagyása' },
      { text: 'GDPR-kompatibilis arcadat-kezelés' },
      { text: 'Batch feldolgozás (akár 500+ kép egyszerre)' },
      { text: 'Arcfelismerés tömegképeken is' },
      { text: 'Integrált a Képválasztó galériával' },
      { text: 'Arcfelismerési napló audithoz' },
    ],
    screenshots: [
      { src: null, alt: 'Arcfelismerés folyamat', caption: 'Az AI valós időben azonosítja és rendezi a képeket diákonként' },
      { src: null, alt: 'Bizonytalan találatok lista', caption: 'A bizonytalan egyezések listája — te döntöd el, mi a helyes párosítás' },
      { src: null, alt: 'Rendezett diák galéria', caption: 'Az eredmény: minden diák képei egy helyen, automatikusan' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Iskolai fotós 300+ diákkal',
        description:
          'Nagy iskolában kézzel lehetetlen diákonként rendezni a képeket — az AI ezt percek alatt elvégzi, a fotós azonnal mehet tovább.',
      },
      {
        icon: 'graduation-cap',
        persona: 'Ballagási fotós',
        description:
          'A ballagáson készített 500 csoportképen az AI megtalálja, melyiken szerepel az adott végzős — perceken belül kész a személyes galéria.',
      },
    ],
    faq: [
      {
        question: 'Tárolja-e a rendszer az arcfelismerési adatokat hosszú távon?',
        answer:
          'Nem. Az arcvonásokból generált biometrikus adatokat csak a szortírozási folyamat idejére tároljuk, utána töröljük. Ez megfelel a GDPR elvárásainak.',
      },
      {
        question: 'Mi történik ikrek vagy nagyon hasonló külsejű diákok esetén?',
        answer:
          'Az ilyen eseteket a rendszer alacsony biztonságú találatként jelöli, és manuális jóváhagyásra vár — így garantált a pontosság.',
      },
      {
        question: 'Hány képet lehet egyszerre feldolgozni?',
        answer:
          'A rendszer batch feldolgozásban egyszerre akár 500 képet is feldolgoz. Nagyobb projekteknél a feldolgozás sorban fut, az irányítópulton követhető az állapot.',
      },
    ],
    relatedModuleKeys: ['kepvalaszto', 'tablo_editor_desktop', 'ai_crop', 'ai_retouch'],
  },

  // ─────────────────────────────────────────────
  // 13. AI RETUSÁLÁS
  // ─────────────────────────────────────────────
  ai_retouch: {
    moduleKey: 'ai_retouch',
    badge: '⭐ Népszerű',
    heroGradient: 'from-fuchsia-500',
    benefits: [
      {
        icon: 'sparkles',
        title: 'Professzionális retusálás pillanatok alatt',
        description:
          'Az AI automatikusan simítja a bőrt, korrigálja a fényt és eltávolítja az apró bőrhibákat — manuális Photoshop munka nélkül.',
      },
      {
        icon: 'eraser',
        title: 'Természetes, nem túlretusált eredmény',
        description:
          'A retusálás finoman, nem festett hatással dolgozik — a végeredmény természetes marad, nem úgy néz ki, mint egy szűrt közösségi médiás kép.',
      },
      {
        icon: 'clock',
        title: 'Másodpercek alatt 30 Ft/képért',
        description:
          'Egy portré retusálása 30 Ft-ba kerül és másodpercek alatt elkészül — a hagyományos manuális retusálás töredéke az idő és a költség.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Kiválasztod a retusálandó képeket',
        description:
          'A galériában megjelölöd, melyik képeket szeretnéd AI-val retusálni — egyesével vagy teljes osztályt egyszerre.',
      },
      {
        step: 2,
        title: 'Az AI elvégzi a retusálást',
        description:
          'A rendszer feldolgozza a képeket: bőrsimítás, fénykorrekció, szemfehérje javítás, apró bőrhibák eltüntetése — automatikusan.',
      },
      {
        step: 3,
        title: 'Összehasonlítod és elfogadod',
        description:
          'Egymás melletti előtte/utána nézetben összehasonlíthatod az eredeti és a retusált képet — ha nem megfelelő, visszatérhetsz az eredetihez.',
      },
    ],
    features: [
      { text: 'Bőrsimítás természetes hatással' },
      { text: 'Automatikus fény- és kontrasztkorrekció' },
      { text: 'Szemfehérje és fogfehérítés' },
      { text: 'Apró bőrhibák és pattanások eltüntetése' },
      { text: 'Köteg feldolgozás — teljes osztály egyszerre' },
      { text: 'Előtte/utána összehasonlító nézet' },
      { text: 'Retusálás erősségének beállítása' },
      { text: 'Eredeti kép mindig megőrzött (visszaállítható)' },
      { text: 'Kredit alapú, csak tényleges felhasználásért fizetsz' },
    ],
    screenshots: [
      { src: null, alt: 'AI retusálás előtte-utána', caption: 'Természetes retusálás — bőrsimítás, fénykorrekció, hibák eltüntetése' },
      { src: null, alt: 'Batch retusálás kiválasztó', caption: 'Teljes osztály retusálása egyszerre — percek alatt kész' },
    ],
    useCases: [
      {
        icon: 'camera',
        persona: 'Iskolafotós gyors átfutással',
        description:
          'A fotózás után azonnal retusálja a képeket AI-val — a galéria még aznap kinyitható, nem kell napokat várni a Photoshop munkára.',
      },
      {
        icon: 'graduation-cap',
        persona: 'Érettségi portré fotós',
        description:
          'Az érettségi előtt minden diák portréját finoman retusálja — az AI elvégzi az alapmunkát, ő csak a különleges esetekre összpontosít.',
      },
    ],
    faq: [
      {
        question: 'Mennyibe kerül és hogyan számolódik el a 30 Ft/kép díj?',
        answer:
          'Minden feldolgozott képért 30 Ft kerül levonásra a kredit-egyenlegedből. Krediteket a fiókod feltöltés oldalán vásárolhatsz. A havidíj nem tartalmaz krediteket.',
      },
      {
        question: 'Az eredeti kép megmarad a retusálás után is?',
        answer:
          'Igen. Az eredeti kép mindig sértetlenül megmarad a rendszerben — a retusált verzió egy új fájlként jön létre, bármikor visszaállíthatsz az eredetire.',
      },
    ],
    relatedModuleKeys: ['ai_face_recognition', 'ai_background_removal', 'ai_crop', 'kepvalaszto'],
  },

  // ─────────────────────────────────────────────
  // 14. AI HÁTTÉR ELTÁVOLÍTÁS
  // ─────────────────────────────────────────────
  ai_background_removal: {
    moduleKey: 'ai_background_removal',
    badge: '🆕 Új',
    heroGradient: 'from-slate-500',
    benefits: [
      {
        icon: 'eraser',
        title: 'Tökéletes kivágás automatikusan',
        description:
          'Az AI pontosan kivágja a személyt a háttérből — még bonyolult széleken (haj, áttetsző ruha) is professzionális eredmény.',
      },
      {
        icon: 'image',
        title: 'Háttércsere egyetlen kattintással',
        description:
          'A kivágott portrére azonnal alkalmazhatsz egyszínű, gradiens vagy egyedi fotós hátteret — tökéletes tablóhoz és webes galériához.',
      },
      {
        icon: 'layers',
        title: 'Ideális tablószerkesztőhöz',
        description:
          'A kivágott PNG képek közvetlenül a Tablószerkesztőbe kerülnek — nincs manuális maszkozás, a tablo azonnal összerakható.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Kijelölöd a feldolgozandó képeket',
        description:
          'Kiválasztod a galériában azokat a portrékat, amelyekről el szeretnéd távolítani a hátteret — egyenként vagy batch módban.',
      },
      {
        step: 2,
        title: 'Az AI eltávolítja a hátteret',
        description:
          'A rendszer másodpercek alatt kivágja a személyt, átlátszó hátterű PNG fájlt generál — az eredmény ellenőrizhető a szerkesztőben.',
      },
      {
        step: 3,
        title: 'Hátterét cseréled és exportálod',
        description:
          'Kiválasztasz egy új háttérszínt vagy képet, a rendszer összeolvasztja a réteget — készen áll a nyomtatásra vagy tablóba illesztésre.',
      },
    ],
    features: [
      { text: 'AI-alapú automatikus háttér eltávolítás' },
      { text: 'Átlátszó PNG kimenet (alpha channel)' },
      { text: 'Egyszínű és fotós háttércsere' },
      { text: 'Köteg feldolgozás egyszerre több képen' },
      { text: 'Bonyolult szél kezelés (haj, áttetsző ruhák)' },
      { text: 'Közvetlen integráció a Tablószerkesztővel' },
      { text: 'Manuális finomítás ecsettel' },
      { text: 'Eredeti kép mindig megőrzött' },
    ],
    screenshots: [
      { src: null, alt: 'Háttér eltávolítás eredmény', caption: 'Tökéletes kivágás: az AI gondosan kezeli a haj és a ruha szélét is' },
      { src: null, alt: 'Háttércsere szerkesztő', caption: 'Új háttér alkalmazása — szín, gradiens vagy egyedi fotó' },
    ],
    useCases: [
      {
        icon: 'layout-template',
        persona: 'Tablókészítő fotós',
        description:
          'A tablóhoz minden portré egyforma fehér háttéren kell — az AI tömegesen elvégzi a kivágást, a tablo tökéletes egységes lesz.',
      },
      {
        icon: 'store',
        persona: 'Webshop-fotós',
        description:
          'A webshop termékoldalán átlátszó hátterű PNG képek kellenek — az AI percek alatt eltávolítja az összes hátteret.',
      },
    ],
    faq: [
      {
        question: 'Miért 50 Ft/kép, ez drágább mint más szolgáltatások?',
        answer:
          'Az 50 Ft/kép tartalmazza a kivágást, a minőség-ellenőrzést és a közvetlen Tablószerkesztő integrációt. Más eszközöknél külön kellene kézzel áttolni a fájlokat.',
      },
      {
        question: 'Mit csináljak, ha az AI nem pontosan vágott ki egy bonyolult szélnél?',
        answer:
          'A szerkesztőben elérhető manuális finomítás ecsettel — a gondos széleket utólag precízen korrigálhatod anélkül, hogy az egészet újra kellene kezdeni.',
      },
    ],
    relatedModuleKeys: ['ai_crop', 'ai_retouch', 'tablo_editor_desktop', 'sablonkezelo'],
  },

  // ─────────────────────────────────────────────
  // 15. AI EGYSÉGES CROP
  // ─────────────────────────────────────────────
  ai_crop: {
    moduleKey: 'ai_crop',
    badge: '🆕 Új',
    heroGradient: 'from-red-500',
    benefits: [
      {
        icon: 'crop',
        title: 'Szem-kiegyenlített automatikus kivágás',
        description:
          'Az AI minden portréon azonosítja a szemek helyzetét, és úgy vágja ki a képet, hogy a szemek minden tablón ugyanazon a magasságon legyenek.',
      },
      {
        icon: 'sparkles',
        title: 'Tökéletesen egységes tablómegjelenés',
        description:
          'A fejek azonos méretben és pozícióban jelennek meg — a tablo professzionális és összeszedett benyomást kelt, nincs ugrálás a fejek között.',
      },
      {
        icon: 'clock',
        title: 'Percek helyett másodpercek',
        description:
          'Egy 30 fős osztály 30 képének kézi kivágása 1–2 óra — az AI ezt 30 másodperc alatt elvégzi 15 Ft/képért.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Megadod a kívánt képarányt és fejméret-paramétert',
        description:
          'Beállítod a célképarányt (pl. 3:4 portré) és azt, hogy a fej a kép területének hány százalékát foglalja el — ez minden képre egységesen érvényes.',
      },
      {
        step: 2,
        title: 'Az AI felismeri az arcokat és kivágja a képeket',
        description:
          'A rendszer minden képen azonosítja a szemek középvonalát, és ezt referenciapontként használva kivágja a portrét — egységes szemmagassággal.',
      },
      {
        step: 3,
        title: 'Ellenőrzöd az eredményt és a tablóba töltöd',
        description:
          'Rácsos nézetben látod az összes kivágott portrét — ha valamelyik nem megfelelő, egyedileg módosítod, majd a Tablószerkesztőbe küldöd.',
      },
    ],
    features: [
      { text: 'Szem-kiegyenlített automatikus kivágás' },
      { text: 'Fejméret-egységesítés beállítható arányokkal' },
      { text: 'Batch feldolgozás — egész osztály egyszerre' },
      { text: 'Közvetlen export a Tablószerkesztőbe' },
      { text: 'Rácsos előnézet ellenőrzéshez' },
      { text: 'Egyedi manuális korrekció lehetősége' },
      { text: 'Több képarány támogatása (1:1, 3:4, 2:3)' },
      { text: 'Eredeti kép mindig megőrzött' },
    ],
    screenshots: [
      { src: null, alt: 'AI Crop rácsos előnézet', caption: 'Rácsos nézet — 30 portré egyszerre, azonos szemmagassággal' },
      { src: null, alt: 'AI Crop beállítás panel', caption: 'Képarány és fejméret beállítás — egy paraméter, egységes eredmény' },
    ],
    useCases: [
      {
        icon: 'layout-template',
        persona: 'Tablókészítő fotós egységes kinézetért',
        description:
          'A tablo csak akkor néz ki jól, ha minden portré azonos méretű és a szemek egy vonalban vannak — az AI ezt automatikusan megoldja.',
      },
      {
        icon: 'graduation-cap',
        persona: 'Érettségi évkönyv szerkesztő',
        description:
          'Az évkönyvben 100+ végzős portréja szerepel — az AI egységes kivágással biztosítja, hogy az összes kép illeszkedik a rácshoz.',
      },
    ],
    faq: [
      {
        question: 'Mi a különbség az AI Crop és a hagyományos képkivágás között?',
        answer:
          'A hagyományos kivágás fix koordinátákat alkalmaz minden képre — a fejek ugrálnak. Az AI Crop minden képen külön azonosítja a szemek helyzetét, így a végeredmény tényleg egységes.',
      },
      {
        question: 'Működik-e az AI Crop, ha a diák nem néz egyenesen a kamerába?',
        answer:
          'Igen. Az AI kismértékű fejefordulás és billenés esetén is pontosan azonosítja a szemek helyzetét. Extrém szögben, 45 fok fölött már a manuális korrekció ajánlott.',
      },
    ],
    relatedModuleKeys: ['ai_face_recognition', 'ai_background_removal', 'tablo_editor_desktop', 'sablonkezelo'],
  },

  // ─────────────────────────────────────────────
  // 16. AI ASSZISZTENS
  // ─────────────────────────────────────────────
  ai_help: {
    moduleKey: 'ai_help',
    badge: null,
    heroGradient: 'from-violet-500',
    benefits: [
      {
        icon: 'bot',
        title: 'Azonnali válaszok a rendszerről',
        description: 'Bármit kérdezel a PhotoStack használatáról, az AI segítő magyar nyelven, azonnal válaszol — nincs várakozás ügyfélszolgálatra.',
      },
      {
        icon: 'book-open',
        title: 'Kontextus-érzékeny segítség',
        description: 'Az AI tudja, melyik oldalon vagy, és az aktuális funkcióhoz kapcsolódó tippeket ad — személyre szabott segítség.',
      },
      {
        icon: 'sparkles',
        title: 'Tanul a te adataidból',
        description: 'Az asszisztens ismeri a te projektjeidet, beállításaidat, így konkrét kérdésekre is tud válaszolni, nem csak általánosságokat mond.',
      },
    ],
    steps: [
      { step: 1, title: 'Megnyitod a chatablakot', description: 'A jobb alsó sarokban lévő chat ikonra kattintasz, és a chatablak azonnal megnyílik.' },
      { step: 2, title: 'Felteszed a kérdésedet magyarul', description: 'Bármit kérdezhetsz a rendszerről: hogyan működik egy funkció, hol találsz egy beállítást, mit jelent egy hibaüzenet.' },
      { step: 3, title: 'Az AI azonnal válaszol', description: 'A válasz másodpercek alatt megérkezik, lépésről lépésre elmagyarázza a megoldást, képernyőkép-hivatkozásokkal.' },
    ],
    features: [
      { text: 'Magyar nyelvű chatbot felület' },
      { text: 'Kontextus-érzékeny válaszok (oldal-alapú)' },
      { text: 'Lépésről lépésre útmutatók' },
      { text: 'A te adataidból is válaszol' },
      { text: 'Napi üzenetlimit a csomagtól függően' },
      { text: 'Gyors válaszidő (2-5 másodperc)' },
    ],
    screenshots: [
      { src: null, alt: 'AI chatbot felület', caption: 'Magyar nyelvű chatbot — kérdezz bármit a rendszerről' },
      { src: null, alt: 'Kontextus-érzékeny tippek', caption: 'Az AI az aktuális oldalhoz kapcsolódó tippeket ad' },
    ],
    useCases: [
      { icon: 'user', persona: 'Új felhasználó', description: 'Nem ismeri még a rendszert — az AI lépésről lépésre segíti az első projekt létrehozásában.' },
      { icon: 'camera', persona: 'Tapasztalt fotós, ritka funkció', description: 'Ritkán használt beállítást keres — az AI azonnal megmutatja a pontos helyet és a lépéseket.' },
    ],
    faq: [
      { question: 'Mennyibe kerül az AI Asszisztens?', answer: 'Az Alap csomagban napi 10 üzenet ingyenes. A bővített csomagokban 50-100 üzenet érhető el naponta.' },
      { question: 'Kapok-e emberi ügyfélszolgálatot is?', answer: 'Igen. Ha az AI nem tudja megválaszolni a kérdésedet, az üzenet automatikusan továbbítható az ügyfélszolgálatra.' },
    ],
    relatedModuleKeys: ['email_notifications', 'bug_reports'],
  },

  // ─────────────────────────────────────────────
  // 17. FÓRUM
  // ─────────────────────────────────────────────
  forum: {
    moduleKey: 'forum',
    badge: null,
    heroGradient: 'from-indigo-500',
    benefits: [
      { icon: 'message-square', title: 'Zárt közösségi tér', description: 'A szülők és a fotós egy biztonságos, zárt platformon kommunikálhatnak — nincs szükség Facebook csoportra.' },
      { icon: 'users', title: 'Osztályonkénti fórumok', description: 'Minden osztálynak saját fórum szekció — a szülők az osztálytársak szüleivel is kapcsolatba léphetnek.' },
      { icon: 'bell', title: 'Értesítések válaszokról', description: 'A szülők e-mail vagy push értesítést kapnak, ha valaki válaszol a témájukra — aktív közösségi részvétel.' },
    ],
    steps: [
      { step: 1, title: 'Létrehozod a fórum szekciót', description: 'A projekt beállításaiban bekapcsolod a fórumot, és meghatározod a szülői hozzáférés szintjét.' },
      { step: 2, title: 'A szülők hozzászólnak', description: 'A szülők a galéria felületen elérhető fórum szekcióban kérdéseket tesznek fel, véleményt mondanak.' },
      { step: 3, title: 'Te moderálod és válaszolsz', description: 'Az irányítópulton egy helyen látod az összes hozzászólást, válaszolsz, és szükség esetén moderálsz.' },
    ],
    features: [
      { text: 'Osztályonkénti zárt fórum szekciók' },
      { text: 'Szülői kérdések és hozzászólások' },
      { text: 'Fotós válaszok kiemelve' },
      { text: 'Kép megosztás a fórumon' },
      { text: 'E-mail értesítés új hozzászólásról' },
      { text: 'Moderálási eszközök (törlés, rögzítés)' },
      { text: 'Keresés a fórum témákban' },
    ],
    screenshots: [
      { src: null, alt: 'Fórum nézet szülőknek', caption: 'Zárt közösségi tér — a szülők kérdeznek, a fotós válaszol' },
      { src: null, alt: 'Moderálási irányítópult', caption: 'Minden hozzászólás egy helyen — moderálás és válaszadás egyszerűen' },
    ],
    useCases: [
      { icon: 'school', persona: 'Osztályfőnök koordinátor', description: 'A szülők a fórumon egyeztetik a tabló részleteit — nem kell külön WhatsApp csoportot kezelni.' },
      { icon: 'camera', persona: 'Fotós a szülőkkel', description: 'A fotós a fórumon mutat előnézeteket, és a szülők közvetlenül adnak visszajelzést — nincs e-mail pingpong.' },
    ],
    faq: [
      { question: 'Látják-e a szülők más osztályok fórumát?', answer: 'Nem. Minden osztálynak saját zárt szekciója van — a szülők csak a saját osztályuk fórumát látják.' },
      { question: 'Törölhetem a nem odaillő hozzászólásokat?', answer: 'Igen. Teljes moderálási jogosultsággal rendelkezel: törlés, szerkesztés, rögzítés, és felhasználó némítás is elérhető.' },
    ],
    relatedModuleKeys: ['voting', 'newsfeed', 'kepvalaszto', 'poke'],
  },

  // ─────────────────────────────────────────────
  // 18. SZAVAZÁS
  // ─────────────────────────────────────────────
  voting: {
    moduleKey: 'voting',
    badge: null,
    heroGradient: 'from-amber-500',
    benefits: [
      { icon: 'vote', title: 'Demokratikus döntéshozatal', description: 'A diákok és szülők szavazhatnak a tablódesignról, a csoportkép kiválasztásáról — mindenki részt vehet a döntésben.' },
      { icon: 'bar-chart-3', title: 'Valós idejű eredmények', description: 'A szavazás eredménye élőben frissül — a fotós és az osztály is követheti, melyik opció vezet.' },
      { icon: 'shield-check', title: 'Manipuláció-mentes szavazás', description: 'Egy szülő = egy szavazat. A rendszer IP és fiók szinten is védi a szavazás tisztaságát.' },
    ],
    steps: [
      { step: 1, title: 'Létrehozod a szavazást', description: 'Meghatározod a kérdést, feltöltöd az opciókat (képek, szöveg, design variációk) és beállítod a szavazás időtartamát.' },
      { step: 2, title: 'A diákok és szülők szavaznak', description: 'A galéria felületen szavaznak — a szülők a saját fiókjukból, a diákok pedig az osztálykóddal belépve.' },
      { step: 3, title: 'Lezárod és kihirdeted az eredményt', description: 'A szavazás lezárása után az eredmény automatikusan közzétehető — a nyertes opciót a rendszer kiemeli.' },
    ],
    features: [
      { text: 'Képes és szöveges szavazás opciók' },
      { text: 'Többféle szavazás típus (igen/nem, rangsor, többes)' },
      { text: 'Valós idejű eredmény megjelenítés' },
      { text: 'Időkorlát beállítása' },
      { text: 'Egy szülő = egy szavazat védelem' },
      { text: 'Automatikus eredményhirdetés' },
      { text: 'Exportálható szavazási összesítő' },
    ],
    screenshots: [
      { src: null, alt: 'Szavazás felület szülőknek', caption: 'Egyszerű, vizuális szavazás — a szülők képre kattintva szavaznak' },
      { src: null, alt: 'Szavazási eredmények grafikon', caption: 'Valós idejű eredmények — a vezető opció élőben frissül' },
    ],
    useCases: [
      { icon: 'graduation-cap', persona: 'Végzős osztály', description: 'A diákok szavaznak, melyik tablódesign legyen a végleges — demokratikusan, civakodás nélkül.' },
      { icon: 'camera', persona: 'Fotós több design opcióval', description: 'A fotós feltölti a 3 legjobb designt, a szülők kiválasztják a nyertest — nincs végeláthatatlan egyeztetés.' },
    ],
    faq: [
      { question: 'Szavazhatnak-e a diákok is, nem csak a szülők?', answer: 'Igen. A szavazás létrehozásakor meghatározod, ki szavazhat: csak szülők, csak diákok, vagy mindenki.' },
      { question: 'Hány szavazás hozható létre projektenként?', answer: 'Korlátlan számú szavazás létrehozható — mind egyszerre is futhat, ha szükséges.' },
    ],
    relatedModuleKeys: ['forum', 'newsfeed', 'kepvalaszto'],
  },

  // ─────────────────────────────────────────────
  // 19. HÍRFOLYAM
  // ─────────────────────────────────────────────
  newsfeed: {
    moduleKey: 'newsfeed',
    badge: null,
    heroGradient: 'from-sky-500',
    benefits: [
      { icon: 'newspaper', title: 'Közösségi hírfolyam', description: 'Facebook-szerű hírfolyam az iskolai közösségnek — a fotós posztol, a szülők kommentelnek és lájkolnak.' },
      { icon: 'image', title: 'Képek és videók megosztása', description: 'A fotós megoszthatja a fotózás kulisszáit, behind-the-scenes képeket — a szülők élőben követhetik a munkát.' },
      { icon: 'bell', title: 'Értesítések új posztról', description: 'A szülők értesítést kapnak, ha a fotós új bejegyzést tesz közzé — aktív közösségi részvétel.' },
    ],
    steps: [
      { step: 1, title: 'Új bejegyzést hozol létre', description: 'A fotós ír egy posztot: szöveget, képet, videó linket ad hozzá, és kiválasztja a célközönséget.' },
      { step: 2, title: 'A szülők látják és reagálnak', description: 'A szülők a hírfolyamon látják a bejegyzést, lájkolhatják, kommentelhetik, és kérdéseket tehetnek fel.' },
      { step: 3, title: 'Moderálod a hozzászólásokat', description: 'Az irányítópulton kezeled a kommenteket — válaszolsz, moderálsz, rögzíted a fontos bejegyzéseket.' },
    ],
    features: [
      { text: 'Szöveges és képes bejegyzések' },
      { text: 'Kommentek és reakciók (lájk)' },
      { text: 'Bejegyzés rögzítése a hírfolyam tetejére' },
      { text: 'Célközönség beállítás (iskola/osztály)' },
      { text: 'E-mail értesítés új bejegyzésről' },
      { text: 'Moderálási eszközök' },
      { text: 'Keresés a bejegyzések között' },
    ],
    screenshots: [
      { src: null, alt: 'Hírfolyam szülői nézet', caption: 'A szülők látják a fotós posztjait, lájkolhatják és kommentelhetik' },
      { src: null, alt: 'Új bejegyzés szerkesztő', caption: 'Bejegyzés létrehozása — szöveg, kép, célközönség kiválasztása' },
    ],
    useCases: [
      { icon: 'camera', persona: 'Fotós a kulisszák mögött', description: 'A fotós behind-the-scenes képeket oszt meg a fotózásról — a szülők élvezik a bepillantást és jobban értékelik a munkát.' },
      { icon: 'school', persona: 'Iskolai koordinátor', description: 'Az iskola a hírfolyamon kommunikálja a fotózási időpontokat, az átadás részleteit — egy helyen minden információ.' },
    ],
    faq: [
      { question: 'Csak a fotós posztolhat, vagy a szülők is?', answer: 'Alapértelmezetten csak a fotós és az iskolai koordinátor posztolhat. A szülők kommentelhetnek és reagálhatnak.' },
      { question: 'Látják-e a szülők más osztályok bejegyzéseit?', answer: 'Csak a saját osztályukhoz és az egész iskolához szóló bejegyzéseket látják. Más osztályok privát tartalma rejtett.' },
    ],
    relatedModuleKeys: ['forum', 'voting', 'email_notifications', 'poke'],
  },

  // ─────────────────────────────────────────────
  // 20. GALÉRIA
  // ─────────────────────────────────────────────
  gallery: {
    moduleKey: 'gallery',
    badge: '🆕 Új',
    heroGradient: 'from-pink-500',
    benefits: [
      { icon: 'images', title: 'Publikus portfólió oldal', description: 'Mutasd meg a legjobb munkáidat egy szép, publikus galériaoldalon — a potenciális ügyfelek lenyűgözve lesznek.' },
      { icon: 'globe', title: 'Saját URL és domain', description: 'Egyedi URL-t kapsz (pl. galeria.tablostudio.hu/neved), vagy saját domain-t is használhatsz.' },
      { icon: 'palette', title: 'Testreszabható megjelenés', description: 'Válassz a kész témák közül, vagy szabd testre a színeket és betűtípusokat saját arculatodhoz.' },
    ],
    steps: [
      { step: 1, title: 'Kiválasztod a legjobb munkáidat', description: 'A projektjeidből kiválogatod a publikálásra szánt képeket — a galéria csak a te által jóváhagyottakat mutatja.' },
      { step: 2, title: 'Beállítod a megjelenést', description: 'Kiválasztasz egy témát, feltöltöd a logódat, beállítod a színeket és a kategóriákat.' },
      { step: 3, title: 'Megosztod és promotálod', description: 'A galéria link készen áll a megosztásra — közösségi médiára, névjegykártyára, e-mail aláírásba.' },
    ],
    features: [
      { text: 'Publikus portfólió galéria oldal' },
      { text: 'Saját URL vagy egyedi domain' },
      { text: 'Kategóriák és albumok rendezése' },
      { text: 'Lightbox nézet nagyításhoz' },
      { text: 'Testreszabható téma és színek' },
      { text: 'Mobilbarát, reszponzív megjelenés' },
      { text: 'SEO-barát felépítés' },
    ],
    screenshots: [
      { src: null, alt: 'Galéria publikus oldal', caption: 'Szép, modern portfólió oldal — mutasd meg a munkáidat' },
      { src: null, alt: 'Galéria téma választó', caption: 'Válassz a kész témák közül és szabd testre a megjelenést' },
    ],
    useCases: [
      { icon: 'camera', persona: 'Kezdő fotós, aki ügyfelet keres', description: 'A galéria link a névjegykártyán — a potenciális iskolák azonnal megnézhetik a korábbi munkákat.' },
      { icon: 'building-2', persona: 'Stúdió referencia oldala', description: 'A stúdió referencia oldalaként szolgál — iskolánkénti kategóriákban a legjobb tablók és portréfotók.' },
    ],
    faq: [
      { question: 'Van-e forgalmi limit a galéria oldalon?', answer: 'Nincs. A galéria oldal korlátlan látogatószámot bír, CDN-nel gyorsítva.' },
      { question: 'Használhatok saját domain nevet?', answer: 'Igen. Egyedi domain (pl. galeria.fotostudio.hu) beállítható a DNS irányításával — a rendszer automatikusan kezeli az SSL tanúsítványt.' },
    ],
    relatedModuleKeys: ['branding', 'kepvalaszto', 'digital_downloads'],
  },

  // ─────────────────────────────────────────────
  // 21. QR MEGOSZTÁS
  // ─────────────────────────────────────────────
  qr_sharing: {
    moduleKey: 'qr_sharing',
    badge: '✨ Ingyenes',
    heroGradient: 'from-slate-500',
    benefits: [
      { icon: 'qr-code', title: 'Egyedi QR kód minden diáknak', description: 'Minden diáknak és osztálynak generálhatsz egyedi QR kódot, amit a szülők mobilon azonnal beolvashatnak.' },
      { icon: 'printer', title: 'Nyomtatható kártyák', description: 'A QR kódokat nyomtatható kártyaformátumban is letöltheted — osztd ki a szülői értekezleten vagy a faliújságon.' },
      { icon: 'check-circle', title: 'Gyors belépés regisztráció nélkül', description: 'A szülő beolvassa a QR kódot, és azonnal a galériában van — nincs jelszó, nincs regisztráció.' },
    ],
    steps: [
      { step: 1, title: 'Generálod a QR kódokat', description: 'A projekt beállításaiban egy kattintással generálod az összes QR kódot — diákonként és osztályonként is.' },
      { step: 2, title: 'Kinyomtatod vagy megosztod', description: 'A QR kódokat kinyomtatod (A4, névjegy méret), e-mailben küldöd, vagy a faliújságra ragasztod.' },
      { step: 3, title: 'A szülők beolvassák és belépnek', description: 'A szülő mobiljával beolvassa a QR kódot, és azonnal a galéria nyílik meg — 3 másodperc alatt bent van.' },
    ],
    features: [
      { text: 'Egyedi QR kód diákonként és osztályonként' },
      { text: 'Nyomtatható formátumok (A4, névjegy, matrica)' },
      { text: 'Tömeges QR generálás egy kattintással' },
      { text: 'Testreszabható design (logó, színek)' },
      { text: 'QR kód újragenerálás (biztonsági reset)' },
      { text: 'E-mailes megosztás szülőknek' },
    ],
    screenshots: [
      { src: null, alt: 'QR kód generátor', caption: 'Egyedi QR kódok — diákonként és osztályonként generálva' },
      { src: null, alt: 'Nyomtatható QR kártyák', caption: 'Kinyomtatható A4-es ív vagy névjegy méretű kártyák' },
    ],
    useCases: [
      { icon: 'school', persona: 'Iskolai szülői értekezlet', description: 'A fotós a szülői értekezleten kiosztja a QR kártyákat — a szülők azonnal megnyitják a galériát a telefonjukon.' },
      { icon: 'camera', persona: 'Óvodai faliújság', description: 'Az óvoda faliújságjára kitűzött QR kódot a szülők hazafelé menet beolvassák — kényelmes, modern megoldás.' },
    ],
    faq: [
      { question: 'Mi történik, ha valaki elveszíti a QR kódot?', answer: 'A QR kód újragenerálható — az új kód érvényteleníti a régit, így biztonsági kockázat nincs.' },
      { question: 'Működik-e a QR kód régebbi telefonokon?', answer: 'Igen. A QR kód szabványos formátum, minden 2015 utáni okostelefon beolvassa a beépített kamerával vagy ingyenes QR olvasó alkalmazással.' },
    ],
    relatedModuleKeys: ['kepvalaszto', 'email_notifications', 'poke'],
  },

  // ─────────────────────────────────────────────
  // 22. BRANDING
  // ─────────────────────────────────────────────
  branding: {
    moduleKey: 'branding',
    badge: '✨ Ingyenes',
    heroGradient: 'from-fuchsia-500',
    benefits: [
      { icon: 'palette', title: 'Saját arculat mindenütt', description: 'A szülők a te logódat, színeidet és márkanevedet látják — nem a PhotoStack-et. Professzionális megjelenés.' },
      { icon: 'globe', title: 'Egyedi domain név', description: 'Saját domain (pl. kepek.fotostudio.hu) a bejelentkezési oldalon és a galériákon — teljes márkásítás.' },
      { icon: 'mail', title: 'Saját feladó név az e-maileken', description: 'Az értesítő e-mailek a te nevedben és márkáddal mennek ki — a szülők azonnal tudják, kitől érkezett.' },
    ],
    steps: [
      { step: 1, title: 'Feltöltöd a logód és beállítod a színeket', description: 'A Branding beállításokban feltöltöd a logót, kiválasztod az elsődleges és másodlagos színeket.' },
      { step: 2, title: 'Beállítod a domain-t és az e-mail nevet', description: 'Hozzáadod a saját domain nevedet és beállítod a feladó nevet az e-mailekhez.' },
      { step: 3, title: 'A szülők a te márkádat látják', description: 'Minden felületen — galéria, e-mail, QR kód — a te arculatod jelenik meg.' },
    ],
    features: [
      { text: 'Egyedi logó feltöltése' },
      { text: 'Elsődleges és másodlagos szín beállítása' },
      { text: 'Saját domain név használata' },
      { text: 'Egyedi feladó név az e-mailekhez' },
      { text: 'Betűtípus választás' },
      { text: 'Előnézet a szülői felületen' },
    ],
    screenshots: [
      { src: null, alt: 'Branding beállítások', caption: 'Logó, színek, domain — mindent egy helyen állíthatsz be' },
      { src: null, alt: 'Szülői felület egyedi arculattal', caption: 'A szülők a te márkádat látják — professzionális megjelenés' },
    ],
    useCases: [
      { icon: 'building-2', persona: 'Fotóstúdió márkaépítés', description: 'A stúdió egységes arculatot mutat minden érintkezési ponton — a szülők a stúdió márkájával találkoznak.' },
      { icon: 'camera', persona: 'Egyéni fotós vállalkozó', description: 'A saját neve és logója jelenik meg mindenhol — professzionális benyomást kelt, nem egy „no-name" rendszer.' },
    ],
    faq: [
      { question: 'Látszik-e valahol a PhotoStack név a szülőknek?', answer: 'Nem. A Branding modul aktiválása után a szülők kizárólag a te márkádat látják — a PhotoStack csak a lábléc apró betűs részében szerepel.' },
      { question: 'Hány logót tölthetek fel?', answer: 'Egy elsődleges logót (világos és sötét háttérhez), valamint egy favicont. Ezek jelennek meg a galérián, az e-mailekben és a QR kódokon.' },
    ],
    relatedModuleKeys: ['gallery', 'email_notifications', 'qr_sharing'],
  },

  // ─────────────────────────────────────────────
  // 23. SZÁMLÁZÁS
  // ─────────────────────────────────────────────
  invoicing: {
    moduleKey: 'invoicing',
    badge: '✨ Ingyenes',
    heroGradient: 'from-emerald-500',
    benefits: [
      { icon: 'receipt', title: 'Automatikus számlakiállítás', description: 'Minden rendelés után automatikusan elkészül a számla — nincs manuális könyvelés, nincs elfeledett számla.' },
      { icon: 'shield-check', title: 'NAV online számla kompatibilis', description: 'A kiállított számlák megfelelnek a NAV online számla követelményeinek — automatikus bejelentés.' },
      { icon: 'settings', title: 'Számlázz.hu és Billingo integráció', description: 'Csatlakoztathatod a meglévő Számlázz.hu vagy Billingo fiókodat — a rendszer automatikusan oda állítja ki a számlákat.' },
    ],
    steps: [
      { step: 1, title: 'Beállítod a számlázási adatokat', description: 'Megadod a céges adatokat, az adószámot, és csatlakoztatod a Számlázz.hu vagy Billingo API kulcsot.' },
      { step: 2, title: 'A rendelések automatikusan számlázódnak', description: 'Minden sikeres fizetés után a rendszer automatikusan kiállítja és elküldi a számlát a vevőnek.' },
      { step: 3, title: 'Te csak ellenőrzöd', description: 'Az irányítópulton látod az összes kiállított számlát — exportálható könyveléshez, és a NAV bejelentés automatikus.' },
    ],
    features: [
      { text: 'Automatikus számla rendelésenként' },
      { text: 'Számlázz.hu integráció' },
      { text: 'Billingo integráció' },
      { text: 'NAV online számla kompatibilis' },
      { text: 'PDF számla e-mail küldéssel' },
      { text: 'Exportálható könyvelési lista' },
      { text: 'Sztornó és jóváírás kezelés' },
    ],
    screenshots: [
      { src: null, alt: 'Számlázási beállítások', caption: 'Számlázási integráció — egy API kulcs, és a rendszer mindent intéz' },
      { src: null, alt: 'Kiállított számlák lista', caption: 'Minden számla egy helyen — exportálható könyveléshez' },
    ],
    useCases: [
      { icon: 'briefcase', persona: 'Egyéni vállalkozó fotós', description: 'Nem kell minden rendelés után manuálisan számlát kiállítani — a rendszer automatikusan intézi.' },
      { icon: 'building', persona: 'Könyvelő irodai asszisztens', description: 'A könyvelő havi exportot kap az összes számláról — nem kell egyenként összegyűjtenie.' },
    ],
    faq: [
      { question: 'Szükséges-e Számlázz.hu vagy Billingo fiók?', answer: 'Igen, legalább az egyik szükséges. A rendszer a te fiókodon keresztül állítja ki a számlákat — így a számlasorszámok és a NAV bejelentés a te neveden fut.' },
      { question: 'Automatikusan bejelenti a NAV-nak?', answer: 'Igen, ha a Számlázz.hu vagy Billingo fiókodon be van állítva a NAV online számla, akkor automatikus.' },
    ],
    relatedModuleKeys: ['webshop', 'advancepay', 'gdpr'],
  },

  // ─────────────────────────────────────────────
  // 24. GDPR KEZELÉS
  // ─────────────────────────────────────────────
  gdpr: {
    moduleKey: 'gdpr',
    badge: '✨ Ingyenes',
    heroGradient: 'from-teal-500',
    benefits: [
      { icon: 'shield-check', title: 'GDPR kompatibilis hozzájárulás', description: 'A szülők elektronikusan adják meg a hozzájárulásukat — jogilag érvényes, archiválható, visszakereshető.' },
      { icon: 'lock', title: 'Adatvédelmi tájékoztató kezelés', description: 'A rendszer automatikusan megjeleníti az adatvédelmi tájékoztatót, és archiválja a szülői elfogadást.' },
      { icon: 'file-text', title: 'Adattörlés kérelem kezelés', description: 'Ha egy szülő adattörlést kér, a rendszer végigvezet a folyamaton és dokumentálja a törlést.' },
    ],
    steps: [
      { step: 1, title: 'Beállítod az adatvédelmi tájékoztatót', description: 'Feltöltöd vagy megszerkeszted az adatvédelmi tájékoztatót — a rendszer automatikusan megjeleníti belépéskor.' },
      { step: 2, title: 'A szülők elfogadják elektronikusan', description: 'A szülők a galéria első megnyitásakor elfogadják az adatkezelési feltételeket — minden elfogadás archiválva.' },
      { step: 3, title: 'Kezeled az adatvédelmi kérelmeket', description: 'Adattörlés vagy adatexport kérelem esetén a rendszer végigvezet a folyamaton és dokumentálja a lépéseket.' },
    ],
    features: [
      { text: 'Elektronikus hozzájárulás gyűjtése' },
      { text: 'Adatvédelmi tájékoztató megjelenítés' },
      { text: 'Hozzájárulások archiválása és visszakeresése' },
      { text: 'Adattörlés kérelem kezelő' },
      { text: 'Adatexport funkció (szülői jog)' },
      { text: 'GDPR audit napló' },
    ],
    screenshots: [
      { src: null, alt: 'GDPR hozzájárulás űrlap', caption: 'A szülők elektronikusan fogadják el az adatvédelmi feltételeket' },
      { src: null, alt: 'Hozzájárulások listája', caption: 'Minden hozzájárulás archiválva — visszakereshető audithoz' },
    ],
    useCases: [
      { icon: 'school', persona: 'Iskola adatvédelmi felelős', description: 'Az iskola DPO-ja bármikor lekérheti az adatvédelmi hozzájárulásokat — elektronikus archívumból, azonnal.' },
      { icon: 'camera', persona: 'Fotós GDPR megfelelőséggel', description: 'A fotós biztos lehet abban, hogy jogilag megalapozott hozzájárulása van minden szülőtől — a rendszer automatikusan kezeli.' },
    ],
    faq: [
      { question: 'Elegendő-e a rendszer GDPR modulja a teljes megfelelőséghez?', answer: 'A modul a hozzájárulás-kezelést és az adatvédelmi tájékoztatás megjelenítését biztosítja. A teljes GDPR megfelelőséghez saját adatvédelmi szabályzat szükséges.' },
      { question: 'Mennyire biztonságos az adattárolás?', answer: 'Az adatok EU területén, titkosított adatbázisban tárolódnak. A hozzáférés jogosultság-alapú, és audit napló rögzíti minden adatkezelési műveletet.' },
    ],
    relatedModuleKeys: ['invoicing', 'contacts', 'email_notifications'],
  },

  // ─────────────────────────────────────────────
  // 25. NÉVJEGYEK
  // ─────────────────────────────────────────────
  contacts: {
    moduleKey: 'contacts',
    badge: '✨ Ingyenes',
    heroGradient: 'from-blue-500',
    benefits: [
      { icon: 'contact', title: 'Központi névjegykezelő', description: 'Szülők, tanárok, iskolai kapcsolattartók adatai egy helyen — nem kell Excel táblázatban nyilvántartani.' },
      { icon: 'upload', title: 'Import és export', description: 'Meglévő névjegyeidet importálhatod Excel/CSV-ből, és bármikor exportálhatod őket.' },
      { icon: 'search', title: 'Gyors keresés és szűrés', description: 'Név, iskola, osztály, e-mail cím alapján azonnal megtalálod a keresett kontaktot.' },
    ],
    steps: [
      { step: 1, title: 'Importálod a meglévő névjegyeket', description: 'Excel vagy CSV fájlból feltöltöd a szülők és iskolai kapcsolattartók adatait — a rendszer automatikusan feldolgozza.' },
      { step: 2, title: 'Projektenként rendezed', description: 'A névjegyek projektenként és osztályonként csoportosíthatók — gyors hozzáférés bármely kontakthoz.' },
      { step: 3, title: 'Kommunikálsz a névjegyzékből', description: 'Közvetlenül a névjegylistából indíthatsz e-mailt vagy SMS-t — nem kell külön keresni az elérhetőséget.' },
    ],
    features: [
      { text: 'Központi névjegykezelő felület' },
      { text: 'Excel/CSV import és export' },
      { text: 'Projektenkénti és osztályonkénti csoportosítás' },
      { text: 'Gyors keresés és szűrés' },
      { text: 'Közvetlen e-mail és SMS küldés' },
      { text: 'Duplikátum szűrés és összevonás' },
      { text: 'Kontakt történet (kommunikációs napló)' },
    ],
    screenshots: [
      { src: null, alt: 'Névjegykezelő lista nézet', caption: 'Szülők és kontaktok egy helyen — kereshető, szűrhető lista' },
      { src: null, alt: 'Névjegy részletek és történet', caption: 'Kontakt adatlap — kommunikációs történettel' },
    ],
    useCases: [
      { icon: 'camera', persona: 'Fotós több iskolával', description: 'Egy helyen kezeli az összes iskola kapcsolattartóját — nem kell több Excel táblázatot karbantartani.' },
      { icon: 'building', persona: 'Stúdió irodai munkatárs', description: 'Az adminisztrátor a névjegylistából közvetlenül küld e-mailt a szülőknek — nem kell máshol keresni az elérhetőséget.' },
    ],
    faq: [
      { question: 'Automatikusan bővül a névjegyzék az új szülőkkel?', answer: 'Igen. Ha egy szülő regisztrál a galérián vagy a webshopban, automatikusan bekerül a névjegyzékbe a megadott adataival.' },
      { question: 'Van-e korlát a névjegyek számára?', answer: 'Az Alap csomagban 50 névjegy, az Iskola és Stúdió csomagban korlátlan.' },
    ],
    relatedModuleKeys: ['email_notifications', 'sms_notifications', 'gdpr'],
  },

  // ─────────────────────────────────────────────
  // 26. HIBAJELENTÉS
  // ─────────────────────────────────────────────
  bug_reports: {
    moduleKey: 'bug_reports',
    badge: '✨ Ingyenes',
    heroGradient: 'from-red-500',
    benefits: [
      { icon: 'bug', title: 'Egyszerű hibajelentés', description: 'Ha valami nem működik, egy kattintással jelezd — a rendszer automatikusan csatolja a szükséges technikai adatokat.' },
      { icon: 'paperclip', title: 'Képernyőkép csatolás', description: 'A hibajelentéshez azonnal csatolhatsz képernyőképet — a fejlesztők pontosan látják, mi a probléma.' },
      { icon: 'check-circle', title: 'Státusz követés', description: 'Nyomon követheted, hogy a bejelentett hiba melyik állapotban van — bejelentve, vizsgálat alatt, megoldva.' },
    ],
    steps: [
      { step: 1, title: 'Kattintasz a hibajelentés gombra', description: 'A bal alsó sarokban lévő bogár ikonra kattintasz, és megnyílik a hibajelentő űrlap.' },
      { step: 2, title: 'Leírod a problémát és csatolsz képet', description: 'Röviden leírod, mi nem működik, és csatolsz egy képernyőképet — a rendszer automatikusan mellékeli a technikai adatokat.' },
      { step: 3, title: 'Követed a javítás állapotát', description: 'A hibajelentések listájában látod a státuszt: bejelentve, vizsgálat alatt, megoldva — e-mail értesítést is kapsz.' },
    ],
    features: [
      { text: 'Egy kattintásos hibajelentés' },
      { text: 'Képernyőkép csatolás' },
      { text: 'Automatikus technikai adat gyűjtés' },
      { text: 'Prioritás beállítás' },
      { text: 'Státusz követés (bejelentve → megoldva)' },
      { text: 'E-mail értesítés állapotváltozáskor' },
    ],
    screenshots: [
      { src: null, alt: 'Hibajelentő űrlap', caption: 'Egyszerű hibajelentés — leírás, képernyőkép, küldés' },
      { src: null, alt: 'Hibajelentések lista', caption: 'Bejelentett hibák státusza — követheted a javítás állapotát' },
    ],
    useCases: [
      { icon: 'user', persona: 'Bármely felhasználó', description: 'Ha valami nem működik, azonnal jelzi — nincs szükség hosszas e-mail írásra vagy telefonálásra.' },
      { icon: 'camera', persona: 'Fotós sürgős problémával', description: 'A fotós munka közben jelez egy hibát — a fejlesztők azonnal értesülnek és prioritás alapján javítanak.' },
    ],
    faq: [
      { question: 'Mennyi idő alatt javítják ki a hibákat?', answer: 'A kritikus hibákat 24 órán belül vizsgáljuk, a többit a prioritás alapján — a státuszt a hibajelentések listájában követheted.' },
      { question: 'Látják-e mások az én hibajelentéseimet?', answer: 'Nem. A hibajelentések privátok — csak te és a fejlesztőcsapat látja őket.' },
    ],
    relatedModuleKeys: ['ai_help', 'email_notifications'],
  },

  // ─────────────────────────────────────────────
  // 27. ANALITIKA
  // ─────────────────────────────────────────────
  analytics: {
    moduleKey: 'analytics',
    badge: '⭐ Népszerű',
    heroGradient: 'from-cyan-500',
    benefits: [
      { icon: 'bar-chart-3', title: 'Átfogó üzleti riportok', description: 'Egy dashboard-on látod az egész üzletedet: bevétel, konverzió, népszerű képek, szezonális trendek.' },
      { icon: 'activity', title: 'Valós idejű adatok', description: 'Az adatok élőben frissülnek — nem kell heti riportra várni, azonnal látod a változásokat.' },
      { icon: 'download', title: 'Exportálható PDF riportok', description: 'Havi vagy éves összesítőt generálhatsz PDF-ben — tökéletes a könyvelőnek és az üzleti tervezéshez.' },
    ],
    steps: [
      { step: 1, title: 'Megnyitod az Analitika dashboardot', description: 'A partner menüben az Analitika fülre kattintasz, és azonnal betöltődik az áttekintő dashboard.' },
      { step: 2, title: 'Szűrsz időszakra és projektre', description: 'Kiválasztod a kívánt időszakot (hét, hónap, év) és szűrhetsz iskolára vagy projektre is.' },
      { step: 3, title: 'Exportálod a riportot', description: 'A dashboard-ból egy kattintással generálsz PDF vagy Excel riportot — könyvelőnek, üzleti partnernek.' },
    ],
    features: [
      { text: 'Bevételi dashboard projektenként' },
      { text: 'Konverziós ráta (megtekintés → rendelés)' },
      { text: 'Legnépszerűbb képek és méretek' },
      { text: 'Szezonális trendek grafikonon' },
      { text: 'Iskolánkénti és osztályonkénti bontás' },
      { text: 'PDF és Excel export' },
      { text: 'Valós idejű adatfrissítés' },
    ],
    screenshots: [
      { src: null, alt: 'Analitika dashboard', caption: 'Átfogó üzleti dashboard — bevétel, konverzió, trendek egy helyen' },
      { src: null, alt: 'Bevételi riport grafikon', caption: 'Havi bevétel grafikon — iskolánkénti és időszakos bontásban' },
    ],
    useCases: [
      { icon: 'briefcase', persona: 'Fotós üzleti tervező', description: 'Az éves riportból látja, melyik iskolák a legjövedelmezőbbek — ezalapján tervezi a következő szezon stratégiáját.' },
      { icon: 'building-2', persona: 'Stúdió tulajdonos', description: 'A tulajdonos a dashboard-on követi a csapat teljesítményét és a stúdió pénzügyi állapotát.' },
    ],
    faq: [
      { question: 'Mennyi historikus adat érhető el?', answer: 'Az összes korábbi projekt adata elérhető — nincs időbeli korlát. A riportok bármely múltbeli időszakra generálhatók.' },
      { question: 'Megosztható-e a riport a könyvelővel?', answer: 'Igen. A PDF és Excel riportok letölthetők és továbbküldhetők — vagy közvetlen e-mail megosztás is lehetséges a rendszerből.' },
    ],
    relatedModuleKeys: ['webshop', 'advancepay', 'kepvalaszto', 'team_management'],
  },

  // ─────────────────────────────────────────────
  // 28. FOGLALÁSI NAPTÁR
  // ─────────────────────────────────────────────
  booking: {
    moduleKey: 'booking',
    badge: '🆕 Új',
    heroGradient: 'from-orange-500',
    benefits: [
      { icon: 'calendar', title: 'Online időpontfoglalás', description: 'Az iskolák maguk foglalják le a fotózási időpontot — nincs telefonálgatás, nincs e-mail pingpong.' },
      { icon: 'bell', title: 'Automatikus emlékeztetők', description: 'A rendszer automatikusan emlékezteti az iskolát a közelgő fotózás előtt — nem felejtenek el felkészülni.' },
      { icon: 'refresh-cw', title: 'Google Calendar szinkron', description: 'A foglalások automatikusan megjelennek a Google Naptáradban — nem kell kézzel átvezetni.' },
    ],
    steps: [
      { step: 1, title: 'Beállítod az elérhető időpontokat', description: 'A naptárban megadod a szabad napjaidat és a foglalható időintervallumokat.' },
      { step: 2, title: 'Az iskola lefoglalja az időpontot', description: 'Az iskolai koordinátor a foglalási linken kiválasztja a neki megfelelő időpontot — automatikus visszaigazolás.' },
      { step: 3, title: 'Mindketten emlékeztetőt kapnak', description: 'A fotózás előtt 1 héttel és 1 nappal automatikus emlékeztető megy mindkét félnek.' },
    ],
    features: [
      { text: 'Online foglalási felület iskoláknak' },
      { text: 'Szabad/foglalt naptár nézet' },
      { text: 'Automatikus visszaigazolás' },
      { text: 'Emlékeztetők (1 hét, 1 nap)' },
      { text: 'Google Calendar szinkron' },
      { text: 'Időpont módosítás és lemondás' },
      { text: 'Foglalási előzmények archívum' },
    ],
    screenshots: [
      { src: null, alt: 'Foglalási naptár nézet', caption: 'Szabad és foglalt időpontok áttekintése — havi naptár nézetben' },
      { src: null, alt: 'Iskolai foglalási űrlap', caption: 'Az iskola kiválasztja az időpontot és megerősíti a foglalást' },
    ],
    useCases: [
      { icon: 'school', persona: 'Iskolai titkár', description: 'Az iskolatitkár saját maga foglal időpontot — nem kell telefonon egyeztetni, azonnal látja a szabad napokat.' },
      { icon: 'camera', persona: 'Több iskolás fotós', description: 'A fotós az összes foglalást egy naptárban látja — nincs ütközés, nincs elfelejtett időpont.' },
    ],
    faq: [
      { question: 'Szinkronizálódik-e a Google Naptárral?', answer: 'Igen. Kétirányú szinkron: a foglalások megjelennek a Google-ben, és a Google-ben blokkolt időpontok nem foglalhatók a rendszerben sem.' },
      { question: 'Lemondhatja-e az iskola az időpontot?', answer: 'Igen. Az iskola a foglalási linken módosíthatja vagy lemondhatja az időpontot — a fotós automatikus értesítést kap.' },
    ],
    relatedModuleKeys: ['email_notifications', 'sms_notifications', 'contacts', 'analytics'],
  },

  // ─────────────────────────────────────────────
  // 29. CSAPAT KEZELÉS
  // ─────────────────────────────────────────────
  team_management: {
    moduleKey: 'team_management',
    badge: null,
    heroGradient: 'from-indigo-500',
    benefits: [
      { icon: 'users', title: 'Több fotós, egy fiók', description: 'Több fotós, szerkesztő, asszisztens dolgozhat egy fiókban — mindenki a saját szerepkörével és jogosultságaival.' },
      { icon: 'shield-check', title: 'Szerepkör-alapú jogosultság', description: 'Fotós, designer, marketinges, nyomda, asszisztens — minden szerepkör más-más funkcióhoz fér hozzá.' },
      { icon: 'activity', title: 'Tevékenység napló', description: 'Nyomon követheted, ki mit csinált a rendszerben — áttekinthető tevékenységi napló a csapat minden tagjáról.' },
    ],
    steps: [
      { step: 1, title: 'Meghívod a csapattagokat', description: 'E-mail címmel meghívod a csapattagokat — ők regisztrálnak és automatikusan a te fiókodhoz kapcsolódnak.' },
      { step: 2, title: 'Hozzárendeled a szerepköröket', description: 'Kiválasztod minden csapattagnak a szerepkörét — a jogosultságok automatikusan beállnak.' },
      { step: 3, title: 'Mindenki a saját feladatán dolgozik', description: 'A fotós fotóz, a szerkesztő szerkeszt, a marketinges kampányt küld — mindenki a saját területén, egy rendszerben.' },
    ],
    features: [
      { text: 'Csapattag meghívás e-mailben' },
      { text: '5 előre definiált szerepkör' },
      { text: 'Egyedi jogosultság finomhangolás' },
      { text: 'Tevékenység napló (audit log)' },
      { text: 'Projekt hozzáférés korlátozás' },
      { text: 'Csapattag deaktiválás' },
      { text: 'Csapat áttekintő dashboard' },
    ],
    screenshots: [
      { src: null, alt: 'Csapattagok lista', caption: 'A csapattagok és szerepköreik — egy áttekinthető listában' },
      { src: null, alt: 'Szerepkör beállítások', caption: 'Szerepkör-alapú jogosultságok — minden funkció külön engedélyezhető' },
    ],
    useCases: [
      { icon: 'building-2', persona: 'Fotóstúdió 3-5 fotóssal', description: 'A stúdió tulajdonosa látja a csapat munkáját, mindenki a saját projektjein dolgozik, de az üzleti adatok egységesek.' },
      { icon: 'camera', persona: 'Fotós asszisztenssel', description: 'A fotós fotóz, az asszisztens feltölti és rendezi a képeket — a szerepkörök egyértelműen elkülönülnek.' },
    ],
    faq: [
      { question: 'Hány csapattagot addhatok hozzá?', answer: 'A csomag tartalmaz 3 csapattag helyet. További helyek 490 Ft/fő/hó áron bővíthetők — nincs felső korlát.' },
      { question: 'Látja-e az asszisztens a pénzügyi adatokat?', answer: 'Nem, csak ha a szerepkörében ezt külön engedélyezed. Alapértelmezetten az asszisztens csak a képfeltöltést és a projektkezelést látja.' },
    ],
    relatedModuleKeys: ['analytics', 'kepvalaszto', 'tablo_editor_desktop'],
  },

  // ─────────────────────────────────────────────
  // 30. EXTRA TÁRHELY
  // ─────────────────────────────────────────────
  extra_storage: {
    moduleKey: 'extra_storage',
    badge: null,
    heroGradient: 'from-slate-500',
    benefits: [
      { icon: 'hard-drive', title: 'Rugalmasan bővíthető tárhely', description: 'Ha az alap 2 GB nem elég, GB-onként bővítheted — nincs fix csomagváltás, csak annyit fizetsz, amennyire szükséged van.' },
      { icon: 'activity', title: 'Automatikus skálázódás', description: 'A rendszer figyeli a tárhelyhasználatot, és figyelmeztet, mielőtt elfogyik — nincs váratlan leállás.' },
      { icon: 'archive', title: 'Régi projektek archiválása', description: 'A régi projektek fájljai archiválhatók olcsóbb tárhelyre — így a drágább aktív tárhely nem telik meg feleslegesen.' },
    ],
    steps: [
      { step: 1, title: 'Ellenőrzöd a jelenlegi tárhelyet', description: 'Az előfizetés oldalon látod a jelenlegi használatot és a rendelkezésre álló tárhelyet — grafikusan és számokban.' },
      { step: 2, title: 'Bővíted a szükséges mennyiséggel', description: 'Megadod, hány extra GB-ot szeretnél, és a rendszer automatikusan hozzáadja — azonnal elérhető.' },
      { step: 3, title: 'Havonta fizetsz a tényleges használatért', description: 'Az extra tárhely havi díja automatikusan a számlára kerül — ha csökkented, a díj is csökken.' },
    ],
    features: [
      { text: 'GB-onkénti bővítés (150 Ft/GB/hó)' },
      { text: 'Azonnali aktiválás' },
      { text: 'Tárhelyhasználat monitoring és riasztás' },
      { text: 'Régi projektek archiválása' },
      { text: 'Rugalmas le- és felskálázás' },
      { text: 'Nincs felső korlát' },
    ],
    screenshots: [
      { src: null, alt: 'Tárhely használat dashboard', caption: 'Grafikus áttekintés — jelenlegi használat és rendelkezésre álló hely' },
      { src: null, alt: 'Extra tárhely bővítés', caption: 'GB-onkénti bővítés — azonnal elérhető, havonta számlázva' },
    ],
    useCases: [
      { icon: 'camera', persona: 'Aktív iskolafotós 20+ projekttel', description: 'Egy szezonban 20 iskolát fotóz — az alap 2 GB nem elég, de 20 GB-ra bővítve minden elfér.' },
      { icon: 'building-2', persona: 'Stúdió archívummal', description: 'A stúdió évekre visszamenőleg megőrzi a projekteket — az archív tárhelyre teszi a régieket, az aktívat frissen tartja.' },
    ],
    faq: [
      { question: 'Mennyibe kerül az extra tárhely?', answer: '150 Ft/GB/hó. Pl. 10 GB extra = 1500 Ft/hó. Éves fizetéssel 10% kedvezmény.' },
      { question: 'Mi történik, ha csökkentem az extra tárhelyet?', answer: 'A csökkentés a következő számlázási időszaktól lép életbe. Ha a tényleges használat meghaladja az új limitet, előbb törölnöd kell fájlokat.' },
    ],
    relatedModuleKeys: ['kepvalaszto', 'ai_face_recognition', 'gallery'],
  },
};
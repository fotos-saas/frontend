import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_PHOTO: Record<string, ModuleDetailContent> = {
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
};

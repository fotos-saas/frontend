import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_SALES: Record<string, ModuleDetailContent> = {
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
};

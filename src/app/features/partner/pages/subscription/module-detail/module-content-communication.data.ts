import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_COMMUNICATION: Record<string, ModuleDetailContent> = {
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
};

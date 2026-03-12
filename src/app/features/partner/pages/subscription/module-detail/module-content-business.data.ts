import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_BUSINESS: Record<string, ModuleDetailContent> = {
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

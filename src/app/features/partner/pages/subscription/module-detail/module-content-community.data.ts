import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_COMMUNITY: Record<string, ModuleDetailContent> = {
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
};

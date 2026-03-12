import { ModuleDetailContent } from './module-detail.types';

export const MODULE_CONTENT_AI: Record<string, ModuleDetailContent> = {
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
};

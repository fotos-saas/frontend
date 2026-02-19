/**
 * add-name-layers.jsx — Személynevek text layerek hozzáadása a megnyitott PSD-hez
 *
 * A JSON-t az Electron handler készíti elő (számolás, elnevezés, szétválogatás).
 * Ez a script CSAK a Photoshop DOM-ot manipulálja — layer létrehozás.
 *
 * JSON formátum (előkészített):
 * {
 *   "layers": [
 *     { "layerName": "kiss-janos---42", "displayText": "Kiss János", "group": "Students" },
 *     { "layerName": "szabo-anna---101", "displayText": "Szabó Anna", "group": "Teachers" }
 *   ],
 *   "stats": { "students": 25, "teachers": 3, "total": 28 }
 * }
 *
 * Futtatás: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer (writeln() nem elerheto do javascript modban) ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

(function () {
  var created = 0;
  var errors = 0;

  try {
    // --- 1. Aktiv dokumentum ellenorzes ---
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum! Elobb nyisd meg a PSD-t.");
    }
    var doc = app.activeDocument;
    log("[JSX] Dokumentum: " + doc.name + " (" + doc.width + " x " + doc.height + ")");

    // --- 2. JSON beolvasas (elokeszitett adat az Electron handlertol) ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    log("[JSX] JSON fajl: " + args.dataFilePath);

    // Elobb a nyers fajl tartalmat olvassuk ki debug celbol
    var debugFile = new File(args.dataFilePath);
    debugFile.encoding = "UTF-8";
    debugFile.open("r");
    var rawContent = debugFile.read();
    debugFile.close();
    log("[JSX] JSON fajl meret: " + rawContent.length + " karakter");
    log("[JSX] JSON eleje: " + rawContent.substring(0, 120));

    var data = readJsonFile(args.dataFilePath);

    // Debug: nezzuk mit kaptunk
    log("[JSX] data type: " + typeof data);
    if (data) {
      log("[JSX] data.layers type: " + typeof data.layers);
      if (data.layers) {
        log("[JSX] data.layers.length: " + data.layers.length);
      }
    }

    if (!data || !data.layers || data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      log("[JSX] KESZ: 0 layer, 0 hiba");
      return;
    }

    log("[JSX] Layerek szama: " + data.layers.length + " (diak: " + data.stats.students + ", tanar: " + data.stats.teachers + ")");

    // --- 3. Layerek letrehozasa (a JSON-ban mar kesz adat van) ---
    for (var i = 0; i < data.layers.length; i++) {
      var item = data.layers[i];

      try {
        // Cel csoport keresese: Names/{group}
        var targetGroup = getGroupByPath(doc, ["Names", item.group]);
        if (!targetGroup) {
          log("[JSX] HIBA: Names/" + item.group + " csoport nem talalhato!");
          errors++;
          continue;
        }

        // Text layer letrehozasa a kész adatokkal
        createTextLayer(targetGroup, item.displayText, {
          name: item.layerName,
          font: CONFIG.FONT_NAME,
          size: CONFIG.FONT_SIZE,
          color: CONFIG.TEXT_COLOR
        });
        created++;
      } catch (e) {
        log("[JSX] HIBA layer (" + item.displayText + "): " + e.message);
        errors++;
      }
    }

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + created + " layer letrehozva, " + errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + created + " layer, " + (errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

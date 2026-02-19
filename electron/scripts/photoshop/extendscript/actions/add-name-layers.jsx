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

// --- Globalis valtozok (suspendHistory string-eval nem lat IIFE scope-ot) ---
var _doc, _data, _created = 0, _errors = 0;

function _doAddNameLayers() {
  for (var i = 0; i < _data.layers.length; i++) {
    var item = _data.layers[i];

    try {
      var targetGroup = getGroupByPath(_doc, ["Names", item.group]);
      if (!targetGroup) {
        log("[JSX] HIBA: Names/" + item.group + " csoport nem talalhato!");
        _errors++;
        continue;
      }

      createTextLayer(targetGroup, item.displayText, {
        name: item.layerName,
        font: CONFIG.FONT_NAME,
        size: CONFIG.FONT_SIZE,
        color: CONFIG.TEXT_COLOR,
        alignment: _data.textAlign || "center"
      });
      _created++;
    } catch (e) {
      log("[JSX] HIBA layer (" + item.displayText + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    // --- 1. Cel dokumentum aktivalasa (nev alapjan, ha meg van adva) ---
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum! Elobb nyisd meg a PSD-t.");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    // --- 2. JSON beolvasas (elokeszitett adat az Electron handlertol) ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || !_data.layers || _data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      log("[JSX] KESZ: 0 layer, 0 hiba");
      return;
    }

    log("[JSX] Layerek szama: " + _data.layers.length + " (diak: " + _data.stats.students + ", tanar: " + _data.stats.teachers + ")");

    // --- 3. Layerek letrehozasa — egyetlen history lepes ---
    _doc.suspendHistory("Nev layerek hozzaadasa", "_doAddNameLayers()");

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + _created + " layer letrehozva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _created + " layer, " + (_errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

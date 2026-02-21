/**
 * add-guides.jsx — Tabló margó guide-ok hozzáadása (4 oldal)
 *
 * A JSON marginCm értéke alapján 4 guide-ot helyez el pixelben:
 *   - bal, jobb, felső, alsó
 *
 * A cm → px átszámítás a dokumentum DPI-jével történik.
 * A ruler-t PIXELS-re állítja a pontos guide elhelyezéshez.
 *
 * JSON formátum (Electron handler készíti):
 * {
 *   "marginCm": 2
 * }
 *
 * Futtatás: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Globalis valtozok (suspendHistory string-eval) ---
var _doc, _data;

function _doAddGuides() {
  var marginCm = _data.marginCm;

  // Ruler egyseg pixelre allitasa (guide-ok pixelben lesznek megadva)
  var oldRulerUnits = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  // Dokumentum DPI kiolvasasa
  var dpi = _doc.resolution; // px/inch

  // cm → px: (cm / 2.54) * dpi
  var marginPx = Math.round((marginCm / 2.54) * dpi);

  // Dokumentum meretei pixelben
  var docWidthPx = _doc.width.as("px");
  var docHeightPx = _doc.height.as("px");

  // Letezo guide-ok torlese (tiszta allapotbol indulunk)
  while (_doc.guides.length > 0) {
    _doc.guides[0].remove();
  }

  // 4 guide hozzaadasa PIXELBEN (sima szam — ruler PIXELS-re van allitva)
  _doc.guides.add(Direction.VERTICAL, marginPx);
  _doc.guides.add(Direction.VERTICAL, docWidthPx - marginPx);
  _doc.guides.add(Direction.HORIZONTAL, marginPx);
  _doc.guides.add(Direction.HORIZONTAL, docHeightPx - marginPx);

  // Ruler visszaallitasa az eredeti egysegre
  app.preferences.rulerUnits = oldRulerUnits;

  log("[JSX] 4 guide hozzaadva (" + marginCm + " cm = " + marginPx + " px margo)");
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || typeof _data.marginCm === "undefined") {
      log("[JSX] Nincs margin adat — kilep.");
      return;
    }

    // Guide-ok hozzaadasa — egyetlen history lepes
    _doc.suspendHistory("Tablo margo guide-ok", "_doAddGuides()");

    log("[JSX] KESZ");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

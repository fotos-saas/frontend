/**
 * add-guides.jsx — Tabló margó guide-ok hozzáadása (4 oldal)
 *
 * A CONFIG.MARGIN_CM értéke alapján 4 guide-ot helyez el:
 *   - bal, jobb, felső, alsó
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

  // Dokumentum meretei cm-ben
  var docWidthCm = _doc.width.as("cm");
  var docHeightCm = _doc.height.as("cm");

  log("[JSX] Dokumentum: " + docWidthCm.toFixed(1) + " x " + docHeightCm.toFixed(1) + " cm, margo: " + marginCm + " cm");

  // Letezo guide-ok torlese (tiszta allapotbol indulunk)
  while (_doc.guides.length > 0) {
    _doc.guides[0].remove();
  }

  // 4 guide hozzaadasa (cm ertekek, Photoshop UnitValue-val)
  // Bal
  _doc.guides.add(Direction.VERTICAL, new UnitValue(marginCm, "cm"));
  // Jobb
  _doc.guides.add(Direction.VERTICAL, new UnitValue(docWidthCm - marginCm, "cm"));
  // Felso
  _doc.guides.add(Direction.HORIZONTAL, new UnitValue(marginCm, "cm"));
  // Also
  _doc.guides.add(Direction.HORIZONTAL, new UnitValue(docHeightCm - marginCm, "cm"));

  log("[JSX] 4 guide hozzaadva (" + marginCm + " cm margo)");
}

(function () {
  try {
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum!");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    // JSON beolvasas
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

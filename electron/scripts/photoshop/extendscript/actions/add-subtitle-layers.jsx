/**
 * add-subtitle-layers.jsx — Felirat text layerek hozzaadasa a Subtitles csoportba
 *
 * JSON formatum (az Electron handler kesziti elo):
 * {
 *   "subtitles": [
 *     { "layerName": "iskola-neve", "displayText": "Teleki László Gimnázium" },
 *     { "layerName": "osztaly", "displayText": "12.D" },
 *     { "layerName": "evfolyam", "displayText": "2022 – 2026" }
 *   ]
 * }
 *
 * Minden felirat: Arial 50pt, fekete, center aligned.
 * A Subtitles csoport mar letezik a PSD-ben (psd-tools hozza letre).
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc, _data, _created = 0, _errors = 0;

function _doAddSubtitleLayers() {
  var subtitlesGroup = getGroupByPath(_doc, ["Subtitles"]);
  if (!subtitlesGroup) {
    log("[JSX] HIBA: Subtitles csoport nem talalhato!");
    _errors++;
    return;
  }

  for (var i = 0; i < _data.subtitles.length; i++) {
    var item = _data.subtitles[i];

    try {
      createTextLayer(subtitlesGroup, item.displayText, {
        name: item.layerName,
        font: "ArialMT",
        size: 50,
        color: { r: 0, g: 0, b: 0 },
        alignment: "center"
      });
      _created++;
    } catch (e) {
      log("[JSX] HIBA layer (" + item.layerName + "): " + e.message);
      _errors++;
    }
  }
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

    if (!_data || !_data.subtitles || _data.subtitles.length === 0) {
      log("[JSX] Nincs felirat adat — kilep.");
      log("[JSX] KESZ: 0 felirat, 0 hiba");
      return;
    }

    log("[JSX] Feliratok szama: " + _data.subtitles.length);

    _doc.suspendHistory("Felirat layerek hozzaadasa", "_doAddSubtitleLayers()");

    log("[JSX] KESZ: " + _created + " felirat letrehozva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _created + " felirat, " + (_errors + 1) + " hiba");
  }
})();

_logLines.join("\n");

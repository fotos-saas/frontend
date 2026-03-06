/**
 * add-placeholder-texts.jsx — Placeholder szoveg layerek letrehozasa
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "layers": [
 *     { "layerName": "kiss_janos---42", "displayText": "Lorem ipsum", "group": "Students" }
 *   ],
 *   "textAlign": "center"
 * }
 *
 * Minden szemely mellé egy text layert hoz letre a megadott szoveggel,
 * a Names/Students vagy Names/Teachers csoportba.
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc, _data, _created = 0, _errors = 0;

function _doAddPlaceholderTexts() {
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
      log("[JSX] HIBA layer (" + item.layerName + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name);

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || !_data.layers || _data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      log('{"created":0,"errors":0}');
      _logLines.join("\n");
      return;
    }

    log("[JSX] Layerek szama: " + _data.layers.length);

    _doc.suspendHistory("Placeholder szovegek hozzaadasa", "_doAddPlaceholderTexts()");

    var result = '{"created":' + _created + ',"errors":' + _errors + '}';
    log(result);
  } catch (e) {
    log('{"error":"' + e.message.replace(/"/g, '\\"') + '"}');
  }
})();

_logLines.join("\n");

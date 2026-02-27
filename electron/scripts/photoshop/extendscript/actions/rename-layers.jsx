/**
 * rename-layers.jsx — Layer atnevezes slug---oldID -> slug---newID
 *
 * Bemeneti adat (JSON fajlbol, CONFIG.DATA_FILE_PATH):
 *   { "renameMap": [{"old":"horvath_zsombor_akos---36330","new":"horvath_zsombor_akos---142"}, ...] }
 *
 * Vegigmegy az Images/Students, Images/Teachers, Names/Students, Names/Teachers csoportokon
 * es MINDEN layert atnevez ahol a nev megegyezik.
 *
 * Kimenet: JSON { "renamed": N, "checked": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _doc, _renameMap, _renameResult;

// --- Rekurziv atnevezes a teljes dokumentumban (barmelyik mappa melysegben) ---
function _renameRecursive(container) {
  // artLayerek
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var layer = container.artLayers[i];
      _renameChecked++;
      for (var m = 0; m < _renameMap.length; m++) {
        if (layer.name === _renameMap[m].old) {
          layer.name = _renameMap[m]["new"];
          _renameCount++;
          break;
        }
      }
    }
  } catch (e) { /* nincs artLayers */ }

  // LayerSet-ek rekurziv bejaras
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _renameRecursive(container.layerSets[j]);
    }
  } catch (e) { /* nincs layerSets */ }
}

var _renameCount = 0;
var _renameChecked = 0;

function _doRenameLayers() {
  _renameCount = 0;
  _renameChecked = 0;
  _renameRecursive(_doc);
  _renameResult = '{"renamed":' + _renameCount + ',"checked":' + _renameChecked + '}';
}

// --- Entry point ---
var __result = (function () {
  try {
    if (app.documents.length === 0) {
      return '{"renamed":0,"error":"No document"}';
    }
    _doc = app.activeDocument;

    // JSON fajlbol olvasas
    var dataPath = typeof CONFIG !== "undefined" && CONFIG.DATA_FILE_PATH ? CONFIG.DATA_FILE_PATH : null;
    if (!dataPath) {
      return '{"renamed":0,"error":"No DATA_FILE_PATH"}';
    }

    var f = new File(dataPath);
    if (!f.exists) {
      return '{"renamed":0,"error":"Data file not found: ' + dataPath + '"}';
    }
    f.open("r");
    var content = f.read();
    f.close();

    // ExtendScript JSON parse (nincs nativ JSON.parse)
    _renameMap = [];
    // Keressuk a "renameMap" tombot: {"renameMap":[{"old":"x","new":"y"}, ...]}
    var arrStart = content.indexOf('"renameMap"');
    if (arrStart === -1) {
      return '{"renamed":0,"error":"No renameMap in JSON"}';
    }
    var bracketStart = content.indexOf('[', arrStart);
    var bracketEnd = content.lastIndexOf(']');
    if (bracketStart === -1 || bracketEnd === -1) {
      return '{"renamed":0,"error":"Invalid renameMap JSON"}';
    }
    var arrContent = content.substring(bracketStart + 1, bracketEnd);

    // Parsoljuk az itemeket: {"old":"...","new":"..."}
    var items = arrContent.split('},{');
    for (var i = 0; i < items.length; i++) {
      var s = items[i].replace(/^\s*\{?\s*/, '').replace(/\s*\}?\s*$/, '');
      var oldMatch = s.match(/"old"\s*:\s*"([^"]*)"/);
      var newMatch = s.match(/"new"\s*:\s*"([^"]*)"/);
      if (oldMatch && newMatch) {
        _renameMap.push({ old: oldMatch[1], "new": newMatch[1] });
      }
    }

    if (_renameMap.length === 0) {
      return '{"renamed":0,"error":"Empty renameMap"}';
    }

    _renameResult = '{"renamed":0}';

    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Egyetlen history lepes — Ctrl+Z-vel visszavonhato
    _doc.suspendHistory("Layer ID frissites", "_doRenameLayers()");

    app.preferences.rulerUnits = oldRulerUnits;
    return _renameResult;

  } catch (e) {
    return '{"renamed":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();
__result;

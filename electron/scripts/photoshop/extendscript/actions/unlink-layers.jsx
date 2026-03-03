/**
 * unlink-layers.jsx — Kijelolt layerek linkelesek megszuntetese nev alapjan
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * { "layerNames": ["zombori-tamas---14537", "kiss-janos---14500"] }
 *
 * Mukodes:
 * 1. nameSet-tel O(1) lookup — egyetlen bejaras
 * 2. Mindegyiken futtatja a layer.unlink() DOM metodust
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- BATCH: Egyetlen bejaras, nameSet O(1) lookup ---
function _findLayersByNames(container, nameSet, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var layer = container.artLayers[i];
      if (nameSet[layer.name]) {
        result.push(layer);
      }
    }
  } catch (e) { /* nincs artLayers */ }

  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _findLayersByNames(container.layerSets[j], nameSet, result);
    }
  } catch (e) { /* nincs layerSets */ }
}

(function () {
  try {
    var doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // Bemeneti adatok beolvasasa — JSON file a CONFIG.DATA_FILE_PATH-bol
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }
    var data = readJsonFile(args.dataFilePath);

    var layerNames = data.layerNames;
    if (!layerNames || layerNames.length === 0) {
      throw new Error("Nincs megadott layerName!");
    }

    // nameSet felepitese O(1) lookup-hoz
    var nameSet = {};
    for (var n = 0; n < layerNames.length; n++) {
      nameSet[layerNames[n]] = true;
    }

    // Osszes megfelelo layer megkeresese a dokumentumban
    var foundLayers = [];
    _findLayersByNames(doc, nameSet, foundLayers);

    if (foundLayers.length === 0) {
      log("__UNLINK_RESULT__0");
      throw new Error("Nem talalhato layer a megadott nevekkel");
    }

    // Unlink: minden talalatra futtatjuk a DOM unlink() metodust
    var unlinked = 0;
    for (var i = 0; i < foundLayers.length; i++) {
      try {
        foundLayers[i].unlink();
        unlinked++;
      } catch (e) {
        // Nem linkelt layer — skip
        log("[JSX] WARN: unlink sikertelen (" + foundLayers[i].name + "): " + e.message);
      }
    }

    log("__UNLINK_RESULT__" + unlinked);

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

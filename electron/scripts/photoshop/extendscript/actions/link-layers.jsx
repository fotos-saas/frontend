/**
 * link-layers.jsx — Kijelolt layerek osszelinkelese nev alapjan
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * { "layerNames": ["zombori-tamas---14537", "kiss-janos---14500"] }
 *
 * Mukodes:
 * 1. nameSet-tel O(1) lookup — egyetlen bejaras
 * 2. ActionList-tel batch kijeloles
 * 3. linkSelectedLayers action
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

// --- Tobb layer kijelolese ID alapjan (ActionManager) ---
// Az utils.jsx selectMultipleLayersById-t hasznaljuk (include-olva van)
function _selectMultipleLayersById(layerIds) {
  selectMultipleLayersById(layerIds);
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

    if (foundLayers.length < 2) {
      log("__LINK_RESULT__" + foundLayers.length);
      throw new Error("Legalabb 2 layer kell a linkeleshez (talalt: " + foundLayers.length + ")");
    }

    // Layer ID-k kinyerese
    var layerIds = [];
    for (var i = 0; i < foundLayers.length; i++) {
      layerIds.push(foundLayers[i].id);
    }

    // Batch kijeloles
    _selectMultipleLayersById(layerIds);

    // Linkeles
    var linkDesc = new ActionDescriptor();
    var linkRef = new ActionReference();
    linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    linkDesc.putReference(charIDToTypeID("null"), linkRef);
    executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);

    log("__LINK_RESULT__" + foundLayers.length);

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

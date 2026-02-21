/**
 * link-layers.jsx — Kijelolt layerek osszelinkelese nev alapjan
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * { "layerNames": ["zombori-tamas---14537", "kiss-janos---14500"] }
 *
 * Mukodes:
 * 1. Minden megadott layerName-hez megkeresi az OSSZES azonos nevu layert a dokumentumban
 *    (Images + Names csoportokban is, igy a kep es a nev ossze lesz linkelve)
 * 2. Az osszegyujtott layereket ActionManager-rel kijeloli
 * 3. Futtatja a linkSelectedLayers action-t
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Rekurziv layer kereses nev alapjan ---
function _findLayersByNames(container, targetNames, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var layer = container.artLayers[i];
      for (var n = 0; n < targetNames.length; n++) {
        if (layer.name === targetNames[n]) {
          result.push(layer);
          break;
        }
      }
    }
  } catch (e) { /* nincs artLayers */ }

  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _findLayersByNames(container.layerSets[j], targetNames, result);
    }
  } catch (e) { /* nincs layerSets */ }
}

// --- Tobb layer kijelolese ID alapjan (ActionManager) ---
function _selectMultipleLayersById(layerIds) {
  if (layerIds.length === 0) return;

  // Elso layer kivalasztasa
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerIds[0]);
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);

  // Tobbi layer hozzaadasa a kivalasztashoz (Shift+click megfeleloje)
  for (var i = 1; i < layerIds.length; i++) {
    var addDesc = new ActionDescriptor();
    var addRef = new ActionReference();
    addRef.putIdentifier(charIDToTypeID("Lyr "), layerIds[i]);
    addDesc.putReference(charIDToTypeID("null"), addRef);
    addDesc.putEnumerated(
      stringIDToTypeID("selectionModifier"),
      stringIDToTypeID("selectionModifierType"),
      stringIDToTypeID("addToSelection")
    );
    executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
  }
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

    // Osszes megfelelo layer megkeresese a dokumentumban
    var foundLayers = [];
    _findLayersByNames(doc, layerNames, foundLayers);

    if (foundLayers.length < 2) {
      log("__LINK_RESULT__" + foundLayers.length);
      throw new Error("Legalabb 2 layer kell a linkeleshez (talalt: " + foundLayers.length + ")");
    }

    // Layer ID-k kinyerese
    var layerIds = [];
    for (var i = 0; i < foundLayers.length; i++) {
      layerIds.push(foundLayers[i].id);
    }

    // Layerek kijelolese
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

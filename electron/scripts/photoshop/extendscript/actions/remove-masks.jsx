/**
 * remove-masks.jsx — Raster es vector maszkok eltavolitasa image layerekrol
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "layerNames": ["kiss_janos---42", "szabo_eva---15"]
 * }
 *
 * Minden megadott layerrol eltavolitja a raster (user) es vector mask-ot.
 * Ha nincs mask → kihagyja.
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _removed = 0;
var _skipped = 0;
var _errors = 0;

// --- Rekurziv layer kereses nev alapjan ---
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

// Egyetlen AM hivassal kerdezi le mindket mask tipust
function _getMaskInfo(layerId) {
  try {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    return {
      user: desc.hasKey(stringIDToTypeID("hasUserMask")) && desc.getBoolean(stringIDToTypeID("hasUserMask")),
      vector: desc.hasKey(stringIDToTypeID("hasVectorMask")) && desc.getBoolean(stringIDToTypeID("hasVectorMask"))
    };
  } catch (e) { return { user: false, vector: false }; }
}

function _deleteUserMask() {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("Dlt "), desc, DialogModes.NO);
}

function _deleteVectorMask() {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putClass(stringIDToTypeID("path"));
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("Dlt "), desc, DialogModes.NO);
}

// --- PS-ben kijelolt layerek lekerese (1 bejaras, NEM N×DOM walk) ---
function _getSelectedLayers(doc) {
  var layers = [];
  try {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var docDesc = executeActionGet(ref);
    var idxList = docDesc.getList(stringIDToTypeID("targetLayers"));
    var names = [];
    for (var i = 0; i < idxList.count; i++) {
      var idx = idxList.getReference(i).getIndex(charIDToTypeID("Lyr "));
      var layerRef = new ActionReference();
      layerRef.putIndex(charIDToTypeID("Lyr "), idx + 1);
      var layerDesc = executeActionGet(layerRef);
      names.push(layerDesc.getString(charIDToTypeID("Nm  ")));
    }
    var nameSet = {};
    for (var n = 0; n < names.length; n++) nameSet[names[n]] = true;
    var nameToLayer = {};
    _buildLayerMap(doc, nameSet, nameToLayer);
    for (var k = 0; k < names.length; k++) {
      if (nameToLayer[names[k]]) layers.push(nameToLayer[names[k]]);
    }
  } catch (e) {
    log("[JSX] Kijelolt layerek lekeres hiba: " + e.message);
  }
  return layers;
}

function _buildLayerMap(container, nameSet, map) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var n = container.artLayers[i].name;
      if (nameSet[n] && !map[n]) map[n] = container.artLayers[i];
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _buildLayerMap(container.layerSets[j], nameSet, map);
    }
  } catch (e) {}
}

function _doRemoveMasks() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  var doc = app.activeDocument;
  var foundLayers = [];

  if (data.useSelectedLayers) {
    foundLayers = _getSelectedLayers(doc);
    log("[JSX] PS kijelolt layerek: " + foundLayers.length);
  } else {
    var layerNames = data.layerNames;
    if (!layerNames || layerNames.length === 0) {
      log("[JSX] Nincs layer nev — kilep.");
      return;
    }

    var nameSet = {};
    for (var n = 0; n < layerNames.length; n++) {
      nameSet[layerNames[n]] = true;
    }

    _findLayersByNames(doc, nameSet, foundLayers);
    log("[JSX] Talalt layerek: " + foundLayers.length + "/" + layerNames.length);
  }

  for (var i = 0; i < foundLayers.length; i++) {
    var layer = foundLayers[i];
    try {
      var masks = _getMaskInfo(layer.id);
      if (!masks.user && !masks.vector) { _skipped++; continue; }

      selectLayerById(layer.id);
      doc.activeLayer = layer;

      if (masks.user) _deleteUserMask();
      if (masks.vector) _deleteVectorMask();
      _removed++;
    } catch (e) {
      log("[JSX] HIBA (" + layer.name + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    var doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    doc.suspendHistory("Maszkok eltavolitasa", "_doRemoveMasks()");
    var result = '{"removed":' + _removed + ',"skipped":' + _skipped + ',"errors":' + _errors + '}';
    log(result);
  } catch (e) {
    log('{"error":"' + e.message.replace(/"/g, '\\"') + '"}');
  }
})();

_logLines.join("\n");

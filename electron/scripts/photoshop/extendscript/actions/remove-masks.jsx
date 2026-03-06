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

function _hasUserMask(layerId) {
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("hasUserMask"));
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    return desc.getBoolean(stringIDToTypeID("hasUserMask"));
  } catch (e) { return false; }
}

function _hasVectorMask(layerId) {
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("hasVectorMask"));
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    return desc.getBoolean(stringIDToTypeID("hasVectorMask"));
  } catch (e) { return false; }
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

function _doRemoveMasks() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  var layerNames = data.layerNames;
  if (!layerNames || layerNames.length === 0) {
    log("[JSX] Nincs layer nev — kilep.");
    return;
  }

  var doc = app.activeDocument;

  var nameSet = {};
  for (var n = 0; n < layerNames.length; n++) {
    nameSet[layerNames[n]] = true;
  }

  var foundLayers = [];
  _findLayersByNames(doc, nameSet, foundLayers);

  log("[JSX] Talalt layerek: " + foundLayers.length + "/" + layerNames.length);

  for (var i = 0; i < foundLayers.length; i++) {
    var layer = foundLayers[i];
    try {
      var hadMask = false;

      selectLayerById(layer.id);
      doc.activeLayer = layer;

      if (_hasUserMask(layer.id)) {
        _deleteUserMask();
        hadMask = true;
      }

      if (_hasVectorMask(layer.id)) {
        _deleteVectorMask();
        hadMask = true;
      }

      if (hadMask) {
        _removed++;
      } else {
        _skipped++;
      }
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

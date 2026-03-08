/**
 * rotate-selected.jsx — Kijelolt layerek forgatas adott fokkal
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "angle": 2,
 *   "random": false
 * }
 *
 * Ha random=false: minden layer-t pontosan angle fokkal forgat.
 * Ha random=true: minden layer-t veletlen szogben forgat [-angle, +angle] kozott.
 *
 * A forgatas a layer kozeppontja korul tortenik (AnchorPosition.MIDDLECENTER).
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _rotated = 0;
var _skipped = 0;
var _errors = 0;

// --- PS-ben kijelolt layerek lekerese (ActionDescriptor, ES3) ---
function _getSelectedLayers(doc) {
  var layers = [];
  try {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var docDesc = executeActionGet(ref);
    var idxList = docDesc.getList(stringIDToTypeID("targetLayers"));
    for (var i = 0; i < idxList.count; i++) {
      var idx = idxList.getReference(i).getIndex(charIDToTypeID("Lyr "));
      var layerRef = new ActionReference();
      layerRef.putIndex(charIDToTypeID("Lyr "), idx + 1);
      var layerDesc = executeActionGet(layerRef);
      var layerId = layerDesc.getInteger(stringIDToTypeID("layerID"));
      var found = _findArtLayerById(doc, layerId);
      if (found) layers.push(found);
    }
  } catch (e) {
    log("[JSX] Kijelolt layerek lekeres hiba: " + e.message);
  }
  return layers;
}

function _findArtLayerById(container, id) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].id === id) return container.artLayers[i];
    }
  } catch (e) { /* */ }
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      var found = _findArtLayerById(container.layerSets[j], id);
      if (found) return found;
    }
  } catch (e) { /* */ }
  return null;
}

// --- Pszeudo-random szam generalas [-max, +max] kozott ---
// ExtendScript ES3: Math.random() elerheto
function _randomAngle(maxAngle) {
  return (Math.random() * 2 - 1) * maxAngle;
}

// --- Fo logika ---
function _doRotateSelected() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  var doc = app.activeDocument;
  var angle = data.angle || 0;
  var isRandom = data.random === true;

  if (angle === 0) {
    log("[JSX] angle=0, nincs tennivalo");
    return;
  }

  var absAngle = Math.abs(angle);
  var foundLayers = _getSelectedLayers(doc);
  log("[JSX] Kijelolt layerek: " + foundLayers.length);

  if (foundLayers.length === 0) {
    log("[JSX] Nincs kijelolt layer");
    return;
  }

  for (var i = 0; i < foundLayers.length; i++) {
    var layer = foundLayers[i];
    try {
      // Text layer kihagyas
      if (layer.kind === LayerKind.TEXT) {
        log("[JSX] SKIP (text layer): " + layer.name);
        _skipped++;
        continue;
      }

      selectLayerById(layer.id);
      doc.activeLayer = layer;

      var rotAngle;
      if (isRandom) {
        rotAngle = _randomAngle(absAngle);
        // 2 tizedesre kerekites
        rotAngle = Math.round(rotAngle * 100) / 100;
      } else {
        rotAngle = angle;
      }

      layer.rotate(rotAngle, AnchorPosition.MIDDLECENTER);
      _rotated++;
    } catch (e) {
      log("[JSX] HIBA (" + layer.name + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    var doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    doc.suspendHistory("Layerek forgatasa", "_doRotateSelected()");
    var result = '{"rotated":' + _rotated + ',"skipped":' + _skipped + ',"errors":' + _errors + '}';
    log(result);
  } catch (e) {
    log('{"error":"' + e.message.replace(/"/g, '\\"') + '"}');
  }
})();

_logLines.join("\n");

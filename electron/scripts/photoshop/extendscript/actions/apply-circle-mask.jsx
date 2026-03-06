/**
 * apply-circle-mask.jsx — Kor alaku vector mask alkalmazasa image layerekre
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "layerNames": ["kiss-janos---42", "szabo-eva---15"]
 * }
 *
 * Minden megadott layerre kor alaku vector mask-ot tesz:
 * - Atmeroje = layer szelesseg
 * - Vizszintesen kozepen
 * - Fuggoleges: a layer tetejehez igazitva (top-aligned)
 * - Ha mar van vector mask → kihagyja
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _masked = 0;
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

// --- Ellenorzes: van-e mar mask (vector VAGY raster/user) a layeren ---
function _hasMask(layerId) {
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("hasUserMask"));
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    if (desc.getBoolean(stringIDToTypeID("hasUserMask"))) return true;
  } catch (e) { /* */ }
  try {
    var ref2 = new ActionReference();
    ref2.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("hasVectorMask"));
    ref2.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc2 = executeActionGet(ref2);
    if (desc2.getBoolean(stringIDToTypeID("hasVectorMask"))) return true;
  } catch (e) { /* */ }
  return false;
}

// --- Kor alaku raster mask alkalmazasa ellipszis szelekciobol ---
function _applyCircleMask(layer) {
  var bounds = layer.bounds;
  var layerLeft = bounds[0].as("px");
  var layerTop = bounds[1].as("px");
  var layerRight = bounds[2].as("px");
  var layerBottom = bounds[3].as("px");

  var layerW = layerRight - layerLeft;
  var layerH = layerBottom - layerTop;

  if (layerW <= 0 || layerH <= 0) {
    return false;
  }

  // Kor parameterei: szelesseg = atmero, top-aligned, kozepre igazitva
  var diameter = layerW;
  var circleTop = layerTop;
  var circleBottom = layerTop + diameter;
  var circleLeft = layerLeft;
  var circleRight = layerRight;

  // 1. Ellipszis szelekció készítése
  var selDesc = new ActionDescriptor();
  var selRef = new ActionReference();
  selRef.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  selDesc.putReference(charIDToTypeID("null"), selRef);

  var ellipseDesc = new ActionDescriptor();
  ellipseDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), circleTop);
  ellipseDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), circleLeft);
  ellipseDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), circleBottom);
  ellipseDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), circleRight);

  selDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Elps"), ellipseDesc);
  selDesc.putInteger(stringIDToTypeID("feather"), 0);
  selDesc.putBoolean(charIDToTypeID("AntA"), true);

  executeAction(charIDToTypeID("setd"), selDesc, DialogModes.NO);

  // 2. Layer mask (raster mask) hozzáadása a szelekcióból — Reveal Selection
  var maskDesc = new ActionDescriptor();
  maskDesc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));
  var maskRef = new ActionReference();
  maskRef.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  maskDesc.putReference(charIDToTypeID("At  "), maskRef);
  maskDesc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));

  executeAction(charIDToTypeID("Mk  "), maskDesc, DialogModes.NO);

  // 3. Szelekció törlése
  var deselDesc = new ActionDescriptor();
  var deselRef = new ActionReference();
  deselRef.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  deselDesc.putReference(charIDToTypeID("null"), deselRef);
  deselDesc.putEnumerated(charIDToTypeID("T   "), charIDToTypeID("Ordn"), charIDToTypeID("None"));

  executeAction(charIDToTypeID("setd"), deselDesc, DialogModes.NO);

  return true;
}

function _doApplyCircleMask() {
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

  // Layer nevek lookup (ES3 — nincs Set)
  var nameSet = {};
  for (var n = 0; n < layerNames.length; n++) {
    nameSet[layerNames[n]] = true;
  }

  // Layerek megkeresese
  var foundLayers = [];
  _findLayersByNames(doc, nameSet, foundLayers);

  log("[JSX] Talalt layerek: " + foundLayers.length + "/" + layerNames.length);

  // Maszkolas
  for (var i = 0; i < foundLayers.length; i++) {
    var layer = foundLayers[i];
    try {
      // Text layer → kihagyjuk
      if (layer.kind === LayerKind.TEXT) {
        log("[JSX] SKIP (text layer): " + layer.name);
        _skipped++;
        continue;
      }

      // Mar van mask → kihagyjuk
      if (_hasMask(layer.id)) {
        log("[JSX] SKIP (mar van mask): " + layer.name);
        _skipped++;
        continue;
      }

      selectLayerById(layer.id);
      doc.activeLayer = layer;

      var ok = _applyCircleMask(layer);
      if (ok) {
        _masked++;
      } else {
        log("[JSX] WARN: Layer merete 0: " + layer.name);
        _errors++;
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
    doc.suspendHistory("Kor maszk alkalmazasa", "_doApplyCircleMask()");
    var result = '{"masked":' + _masked + ',"skipped":' + _skipped + ',"errors":' + _errors + '}';
    log(result);
  } catch (e) {
    log('{"error":"' + e.message.replace(/"/g, '\\"') + '"}');
  }
})();

_logLines.join("\n");

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

// --- Ellenorzes: van-e mar vector mask a layeren ---
function _hasVectorMask(layerId) {
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("hasVectorMask"));
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    return desc.getBoolean(stringIDToTypeID("hasVectorMask"));
  } catch (e) {
    return false;
  }
}

// --- Kor alaku vector mask alkalmazasa ActionDescriptor-ral ---
function _applyCircleVectorMask(layer) {
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
  var cx = layerLeft + layerW / 2;
  var circleTop = layerTop;
  var circleBottom = layerTop + diameter;
  var circleLeft = cx - diameter / 2;
  var circleRight = cx + diameter / 2;

  // Photoshop ActionDescriptor: vector mask ellipszis path-bol
  var idMk = charIDToTypeID("Mk  ");
  var desc = new ActionDescriptor();

  // "new" → vector mask
  var ref = new ActionReference();
  ref.putClass(stringIDToTypeID("path"));
  desc.putReference(charIDToTypeID("null"), ref);

  // Target: current layer
  var refTarget = new ActionReference();
  refTarget.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("At  "), refTarget);

  // Path descriptor — vector mask type
  var descPath = new ActionDescriptor();
  descPath.putEnumerated(
    stringIDToTypeID("pathOperation"),
    stringIDToTypeID("shapeOperation"),
    stringIDToTypeID("xor")
  );

  // Ellipszis subpath component
  var descEllipse = new ActionDescriptor();
  descEllipse.putEnumerated(
    stringIDToTypeID("shapeOperation"),
    stringIDToTypeID("shapeOperation"),
    charIDToTypeID("Add ")
  );

  // Ellipszis bounds
  var descBounds = new ActionDescriptor();
  descBounds.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), circleTop);
  descBounds.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), circleLeft);
  descBounds.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), circleBottom);
  descBounds.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), circleRight);

  descEllipse.putObject(charIDToTypeID("Elps"), charIDToTypeID("Elps"), descBounds);

  // Subpath lista
  var listSubpath = new ActionList();
  listSubpath.putObject(stringIDToTypeID("pathComponent"), descEllipse);
  descPath.putList(stringIDToTypeID("pathComponents"), listSubpath);

  desc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("path"), descPath);

  executeAction(idMk, desc, DialogModes.NO);

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
      // Mar van vector mask → kihagyjuk
      if (_hasVectorMask(layer.id)) {
        log("[JSX] SKIP (mar van mask): " + layer.name);
        _skipped++;
        continue;
      }

      selectLayerById(layer.id);
      doc.activeLayer = layer;

      var ok = _applyCircleVectorMask(layer);
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

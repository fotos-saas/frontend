/**
 * apply-border-radius.jsx — Lekerekitett sarku raster mask alkalmazasa image layerekre
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "radius": 30,
 *   "useSelectedLayers": false,
 *   "layerNames": ["kiss-janos---42", "szabo-eva---15"]
 * }
 *
 * Ha useSelectedLayers=true: a PS-ben kijelolt layerekre alkalmazza.
 * Ha false: a layerNames tombben levo nevekre keres rekurzivan.
 * Ha mar van mask → kihagyja.
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

// --- PS-ben kijelolt layerek lekerese (ActionDescriptor, ES3) ---
function _getSelectedLayers(doc) {
  var layers = [];
  try {
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var docDesc = executeActionGet(ref);
    var idxList = docDesc.getList(stringIDToTypeID("targetLayers"));
    log("[JSX] targetLayers count: " + idxList.count);
    for (var i = 0; i < idxList.count; i++) {
      var idx = idxList.getReference(i).getIndex(charIDToTypeID("Lyr "));
      // Layer ID lekerese index alapjan
      var layerRef = new ActionReference();
      layerRef.putIndex(charIDToTypeID("Lyr "), idx + 1);
      var layerDesc = executeActionGet(layerRef);
      var layerName = layerDesc.getString(charIDToTypeID("Nm  "));
      var layerKind = layerDesc.getInteger(stringIDToTypeID("layerKind"));
      log("[JSX] Layer[" + i + "]: " + layerName + " kind=" + layerKind + " idx=" + idx);
      // layerKind: 1=pixel, 3=text, 7=group — csak pixel layereket akarjuk
      var found = _findArtLayerByName(doc, layerName);
      if (found) {
        layers.push(found);
      } else {
        log("[JSX] WARN: Nem talalt ArtLayer: " + layerName);
      }
    }
  } catch (e) {
    log("[JSX] Kijelolt layerek lekeres hiba: " + e.message);
  }
  return layers;
}

function _findArtLayerByName(container, name) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === name) return container.artLayers[i];
    }
  } catch (e) { /* */ }
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      var found = _findArtLayerByName(container.layerSets[j], name);
      if (found) return found;
    }
  } catch (e) { /* */ }
  return null;
}

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

// --- Ellenorzes: van-e mar mask a layeren ---
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

// --- Lekerekitett teglalap selection letrehozasa ---
function _createRoundedRectSelection(left, top, width, height, radius) {
  var right = left + width;
  var bottom = top + height;

  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  desc.putReference(charIDToTypeID("null"), ref);

  var shapeDesc = new ActionDescriptor();
  shapeDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), top);
  shapeDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), left);
  shapeDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), bottom);
  shapeDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), right);

  var radiiDesc = new ActionDescriptor();
  radiiDesc.putUnitDouble(stringIDToTypeID("topLeft"), charIDToTypeID("#Pxl"), radius);
  radiiDesc.putUnitDouble(stringIDToTypeID("topRight"), charIDToTypeID("#Pxl"), radius);
  radiiDesc.putUnitDouble(stringIDToTypeID("bottomRight"), charIDToTypeID("#Pxl"), radius);
  radiiDesc.putUnitDouble(stringIDToTypeID("bottomLeft"), charIDToTypeID("#Pxl"), radius);
  shapeDesc.putObject(stringIDToTypeID("radii"), stringIDToTypeID("radii"), radiiDesc);

  desc.putObject(charIDToTypeID("T   "), stringIDToTypeID("roundedRectangle"), shapeDesc);
  desc.putBoolean(charIDToTypeID("AntA"), true);

  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// --- Raster mask letrehozasa a szelekciobool (Reveal Selection) ---
function _makeLayerMaskFromSelection() {
  var desc = new ActionDescriptor();
  desc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));

  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  desc.putReference(charIDToTypeID("At  "), ref);

  desc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));

  executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
}

// --- Szelekció megszuntetese ---
function _deselect() {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  desc.putReference(charIDToTypeID("null"), ref);
  desc.putEnumerated(charIDToTypeID("T   "), charIDToTypeID("Ordn"), charIDToTypeID("None"));
  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// --- Lekerekitett sarok mask alkalmazasa egy layerre ---
function _applyBorderRadiusMask(layer, radius) {
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

  // Radius korlatozas: max a kisebb oldal fele
  var maxRadius = Math.min(layerW, layerH) / 2;
  var r = Math.min(radius, maxRadius);

  // 1. Lekerekitett teglalap szelekció
  _createRoundedRectSelection(layerLeft, layerTop, layerW, layerH, r);

  // 2. Raster mask a szelekciobool
  _makeLayerMaskFromSelection();

  // 3. Szelekció megszuntetese
  _deselect();

  return true;
}

// --- Fo logika ---
function _doApplyBorderRadius() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  var doc = app.activeDocument;
  var radius = data.radius || 30;
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

      var ok = _applyBorderRadiusMask(layer, radius);
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
    doc.suspendHistory("Lekerekites alkalmazasa", "_doApplyBorderRadius()");
    var result = '{"masked":' + _masked + ',"skipped":' + _skipped + ',"errors":' + _errors + '}';
    log(result);
  } catch (e) {
    log('{"error":"' + e.message.replace(/"/g, '\\"') + '"}');
  }
})();

_logLines.join("\n");

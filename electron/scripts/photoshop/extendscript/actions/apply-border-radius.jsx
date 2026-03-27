/**
 * apply-border-radius.jsx — Lekerekitett sarku raster mask alkalmazasa image layerekre
 *
 * Megoldas: shape layer letrehozas → pixel select → mask → shape torles
 * (tablokiraly eredeti border-radius.jsx logikaja alapjan)
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

// --- Rounded rectangle shape layer letrehozasa (eredeti tablokiraly logika) ---
function _createRoundedRectShapeLayer(doc, layerName, left, top, width, height, radius) {
  var idMk = charIDToTypeID("Mk  ");
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putClass(stringIDToTypeID("contentLayer"));
  desc.putReference(charIDToTypeID("null"), ref);

  var contentDesc = new ActionDescriptor();

  // Feher szin
  var colorDesc = new ActionDescriptor();
  var rgbDesc = new ActionDescriptor();
  rgbDesc.putDouble(charIDToTypeID("Rd  "), 255.0);
  rgbDesc.putDouble(charIDToTypeID("Grn "), 255.0);
  rgbDesc.putDouble(charIDToTypeID("Bl  "), 255.0);
  colorDesc.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), rgbDesc);
  contentDesc.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), colorDesc);

  // Shape koordinatok + radius
  var shapeDesc = new ActionDescriptor();
  shapeDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), top);
  shapeDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), left);
  shapeDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), top + height);
  shapeDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), left + width);
  shapeDesc.putUnitDouble(stringIDToTypeID("radius"), charIDToTypeID("#Pxl"), radius);

  contentDesc.putObject(charIDToTypeID("Shp "), charIDToTypeID("Rctn"), shapeDesc);
  desc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), contentDesc);

  executeAction(idMk, desc, DialogModes.NO);
  doc.activeLayer.name = layerName;
}

// --- Shape layer pixeleinek kivalasztasa (Ctrl+click equivalent) ---
function _selectShapeLayerPixels(layer) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  desc.putReference(charIDToTypeID("null"), ref);

  var ref2 = new ActionReference();
  ref2.putEnumerated(charIDToTypeID("Path"), charIDToTypeID("Path"), stringIDToTypeID("vectorMask"));
  ref2.putIdentifier(charIDToTypeID("Lyr "), layer.id);
  desc.putReference(charIDToTypeID("T   "), ref2);

  desc.putBoolean(charIDToTypeID("AntA"), true);
  desc.putUnitDouble(charIDToTypeID("Fthr"), charIDToTypeID("#Pxl"), 0);

  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// --- Layer mask letrehozasa szelekciobool (Reveal Selection) ---
function _makeLayerMaskFromSelection() {
  var desc = new ActionDescriptor();
  desc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));

  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  desc.putReference(charIDToTypeID("At  "), ref);

  desc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));

  executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
}

// --- Lekerekitett sarok mask alkalmazasa egy layerre ---
// Logika: shape layer → select pixels → mask cel layer-re → shape torles
function _applyBorderRadiusMask(doc, layer, radius) {
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

  // 1. Shape layer letrehozasa (lekerekitett teglalap)
  _createRoundedRectShapeLayer(doc, layer.name + "_br_temp", layerLeft, layerTop, layerW, layerH, r);
  var shapeLayer = doc.activeLayer;

  // 2. Shape layer pixeleinek kivalasztasa
  _selectShapeLayerPixels(shapeLayer);

  // 3. Cel layer aktivalasa
  doc.activeLayer = layer;

  // 4. Mask alkalmazasa a szelekciobool
  _makeLayerMaskFromSelection();

  // 5. Szelekció megszuntetese
  doc.selection.deselect();

  // 6. Shape layer torlese
  shapeLayer.remove();

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

      var ok = _applyBorderRadiusMask(doc, layer, radius);
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

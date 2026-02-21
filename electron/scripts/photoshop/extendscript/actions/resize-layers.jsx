/**
 * resize-layers.jsx — Layerek atmeretezese nev alapjan
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "layerNames": ["kiss-janos---42", "szabo-eva---15"],
 *   "width": 5,
 *   "height": null,
 *   "unit": "cm"
 * }
 *
 * width es height kozul legalabb az egyik kitoltve (a masik null → aranyos).
 * Ha mindketto megadva → pontos meretre resize (aranytalanul is).
 * unit: "cm" vagy "px"
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _resized = 0;
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

function _doResizeLayers() {
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

  var targetW = data.width;
  var targetH = data.height;
  var unit = data.unit || "cm";

  if (targetW === null && targetH === null) {
    throw new Error("Legalabb szelesseg vagy magassag megadasa szukseges!");
  }

  var doc = app.activeDocument;
  var dpi = doc.resolution;

  // cm → px konverzio ha kell
  var targetWPx = null;
  var targetHPx = null;
  if (targetW !== null) {
    targetWPx = (unit === "cm") ? cmToPx(targetW, dpi) : targetW;
  }
  if (targetH !== null) {
    targetHPx = (unit === "cm") ? cmToPx(targetH, dpi) : targetH;
  }

  // Layer nevek lookup objektumba (ES3 — nincs Set)
  var nameSet = {};
  for (var n = 0; n < layerNames.length; n++) {
    nameSet[layerNames[n]] = true;
  }

  // Layerek megkeresese
  var foundLayers = [];
  _findLayersByNames(doc, nameSet, foundLayers);

  log("[JSX] Talalt layerek: " + foundLayers.length + "/" + layerNames.length);

  // Atmeretezes
  for (var i = 0; i < foundLayers.length; i++) {
    var layer = foundLayers[i];
    try {
      selectLayerById(layer.id);
      doc.activeLayer = layer;

      var bounds = layer.bounds;
      var currentW = bounds[2].as("px") - bounds[0].as("px");
      var currentH = bounds[3].as("px") - bounds[1].as("px");

      if (currentW <= 0 || currentH <= 0) {
        log("[JSX] WARN: Layer merete 0: " + layer.name);
        _errors++;
        continue;
      }

      var scaleW, scaleH;

      if (targetWPx !== null && targetHPx !== null) {
        // Mindketto megadva → pontos meret
        scaleW = (targetWPx / currentW) * 100;
        scaleH = (targetHPx / currentH) * 100;
      } else if (targetWPx !== null) {
        // Csak szelesseg → aranyos
        scaleW = (targetWPx / currentW) * 100;
        scaleH = scaleW;
      } else {
        // Csak magassag → aranyos
        scaleH = (targetHPx / currentH) * 100;
        scaleW = scaleH;
      }

      // Csak akkor resize-oljuk ha erdemi valtozas van (>0.5%)
      if (Math.abs(scaleW - 100) > 0.5 || Math.abs(scaleH - 100) > 0.5) {
        layer.resize(scaleW, scaleH, AnchorPosition.MIDDLECENTER);
        _resized++;
      }

    } catch (e) {
      log("[JSX] HIBA (" + layer.name + "): " + e.message);
      _errors++;
    }
  }

  log("__RESIZE_RESULT__" + _resized + "/" + foundLayers.length + " (hiba: " + _errors + ")");
}

(function () {
  try {
    var doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    doc.suspendHistory("Layerek atmeretezese", "_doResizeLayers()");
    log("[JSX] KESZ");
  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

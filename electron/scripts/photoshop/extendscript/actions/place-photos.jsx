/**
 * place-photos.jsx — Fotok behelyezese meglevo Smart Object layerekbe
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "layers": [
 *     { "layerName": "zombori-tamas---14537", "photoPath": "/tmp/psd-photos/zombori.jpg" },
 *     { "layerName": "kiss-janos---14500", "photoPath": "/tmp/psd-photos/kiss.jpg" }
 *   ]
 * }
 *
 * Mukodes:
 * 1. Minden megadott layerName-hez megkeresi a layert (Images csoportban eloszor)
 * 2. Elmenti az eredeti SO bounds-t (meret + pozicio)
 * 3. placedLayerReplaceContents — gyors SO tartalom csere
 * 4. ActionDescriptor transform-mal visszaallitja az eredeti keret meretet (cover mod)
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc;
var _placed = 0;
var _errors = 0;

// --- Rekurziv layer kereses nev alapjan (elso talalat) ---
function _findLayerByName(container, targetName) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === targetName) {
        return container.artLayers[i];
      }
    }
  } catch (e) { /* nincs artLayers */ }

  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      var found = _findLayerByName(container.layerSets[j], targetName);
      if (found) return found;
    }
  } catch (e) { /* nincs layerSets */ }

  return null;
}

// --- Layer bounds kiolvasasa pixelben ---
function _getLayerBounds(layer) {
  var b = layer.bounds;
  var left = b[0].as("px");
  var top = b[1].as("px");
  var right = b[2].as("px");
  var bottom = b[3].as("px");
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2
  };
}

// --- SO layer Free Transform ActionDescriptor-ral ---
// Az origBounds-ba meretezi es pozicionalja a layert (cover mod).
// Ez megbizhato SO layereken is, mert kozvetlenul a transform-ot allitja.
function _transformToFrame(origBounds) {
  var newBounds = _getLayerBounds(_doc.activeLayer);
  if (newBounds.width <= 0 || newBounds.height <= 0) return;

  // Cover mod: a NAGYOBB arany kell (kitolti a keretet)
  var scaleX = (origBounds.width / newBounds.width) * 100;
  var scaleY = (origBounds.height / newBounds.height) * 100;
  var scale = Math.max(scaleX, scaleY);

  // Free Transform ActionDescriptor
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);

  desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));

  var transformDesc = new ActionDescriptor();

  // Meretezes szazalekban
  transformDesc.putUnitDouble(charIDToTypeID("Wdth"), charIDToTypeID("#Prc"), scale);
  transformDesc.putUnitDouble(charIDToTypeID("Hght"), charIDToTypeID("#Prc"), scale);

  desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Trnf"), transformDesc);
  executeAction(charIDToTypeID("Trnf"), desc, DialogModes.NO);

  // Kozepre igazitas az eredeti keret kozepehez
  var afterBounds = _getLayerBounds(_doc.activeLayer);
  var dx = origBounds.centerX - afterBounds.centerX;
  var dy = origBounds.centerY - afterBounds.centerY;

  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    _doc.activeLayer.translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
  }
}

// --- Smart Object tartalom csere (gyors, nem nyit meg kulon dokumentumot) ---
function _replaceSmartObjectContents(photoPath) {
  var desc = new ActionDescriptor();
  desc.putPath(charIDToTypeID("null"), new File(photoPath));
  executeAction(stringIDToTypeID("placedLayerReplaceContents"), desc, DialogModes.NO);
}

function _doPlacePhotos() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  if (!data || !data.layers || data.layers.length === 0) {
    log("[JSX] Nincs layer adat — kilep.");
    return;
  }

  log("[JSX] Fotok behelyezese: " + data.layers.length + " layer");

  // Images csoport keresese — ide kell a fotot behelyezni (nem a Names csoportba)
  var imagesGroup = null;
  try {
    for (var g = 0; g < _doc.layerSets.length; g++) {
      if (_doc.layerSets[g].name === "Images") {
        imagesGroup = _doc.layerSets[g];
        break;
      }
    }
  } catch (e) { /* nincs layerSets */ }

  for (var i = 0; i < data.layers.length; i++) {
    var item = data.layers[i];

    try {
      // Layer keresese: eloszor az Images csoportban, fallback teljes dokumentumra
      var layer = imagesGroup ? _findLayerByName(imagesGroup, item.layerName) : null;
      if (!layer) {
        layer = _findLayerByName(_doc, item.layerName);
      }
      if (!layer) {
        log("[JSX] WARN: Layer nem talalhato: " + item.layerName);
        _errors++;
        continue;
      }

      // Eredeti meret es pozicio mentese a csere elott
      var origBounds = _getLayerBounds(layer);

      // Layer kivalasztasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;

      // Gyors SO tartalom csere
      _replaceSmartObjectContents(item.photoPath);

      // Dokumentum ujra aktivalasa (a replace neha valt)
      _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

      // Free Transform: visszaallitas az eredeti keret meretere (cover mod)
      _transformToFrame(origBounds);

      _placed++;

    } catch (e) {
      log("[JSX] HIBA (" + item.layerName + "): " + e.message);
      _errors++;
      // Dokumentum visszaallitasa hiba utan
      try {
        _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
      } catch (re) { /* ignore */ }
    }
  }

  log("__PLACE_RESULT__" + _placed + "/" + data.layers.length);
}

(function () {
  try {
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum!");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // Egyetlen Undo lepes
    _doc.suspendHistory("Fotok behelyezese", "_doPlacePhotos()");

    log("[JSX] Fotok behelyezese kesz: " + _placed + " sikeres, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

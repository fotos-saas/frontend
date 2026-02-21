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
 * 2. SO megnyitasa szerkesztesre (editContents) — kulon dokumentum nyilik az SO meretevel
 * 3. Kep behelyezese Place Embedded-del → cover meretezes → flatten → mentes → bezaras
 * 4. Igy az SO keret merete 100%-ban megmarad (a PSD-ben beallitott cm/px meret)
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

      // Layer kivalasztasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;

      // SO megnyitas → kep Place → cover meretezes → mentes → bezaras
      // Ez megnyitja az SO belso dokumentumat (aminek a merete az eredeti keret),
      // belerakja a kepet cover modban, flatten, save, close.
      // Igy az SO keret merete 100%-ban megmarad!
      placePhotoInSmartObject(_doc, layer, item.photoPath);

      // Dokumentum ujra aktivalasa (az SO megnyitas/bezaras megvaltoztatja)
      _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

      _placed++;

    } catch (e) {
      log("[JSX] HIBA (" + item.layerName + "): " + e.message);
      _errors++;
      // Ha az SO megnyitva maradt, probaljuk bezarni
      try {
        if (app.documents.length > 1) {
          app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
      } catch (closeErr) { /* ignore */ }
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

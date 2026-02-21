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
 * 1. Minden megadott layerName-hez megkeresi a layert a dokumentumban (rekurziv)
 * 2. A layert kivalasztja (selectLayerById)
 * 3. placedLayerReplaceContents — SO tartalom csere a megadott fotoval
 *
 * Ez a leggyorsabb modszer: NEM nyitja meg az SO-t szerkesztesre,
 * hanem kozvetlenul csereli a tartalmAt. A Photoshop automatikusan
 * atmeretezi a kepet az SO meret aranyaihoz.
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

// --- Smart Object tartalom csere (placedLayerReplaceContents) ---
// A leggyorsabb es legegyszerubb mod: nem nyitja meg az SO-t,
// hanem kozvetlenul csereli a tartalmAt. A Photoshop automatikusan
// illeszti a kep aranyait.
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

      // Layer kivalasztasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;

      // SO tartalom csere
      _replaceSmartObjectContents(item.photoPath);
      _placed++;

      // Dokumentum ujra aktivalasa (a replace neha valt)
      _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

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

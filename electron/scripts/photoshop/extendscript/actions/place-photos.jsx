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

// --- Layer keresese CSAK az Images csoportban (Students + Teachers) ---
// Nem a teljes doc-ban keres, igy nincs dupla SO problema.
function _findImageLayer(doc, layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      if (grp.artLayers[i].name === layerName) return grp.artLayers[i];
    }
  }
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

  // Layer map felepitese EGYSZER (nem N×DOM walk)
  var _imageLayerMap = {};
  var _imgGroups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var ig = 0; ig < _imgGroups.length; ig++) {
    var imgGrp = getGroupByPath(_doc, _imgGroups[ig]);
    if (!imgGrp) continue;
    for (var ia = 0; ia < imgGrp.artLayers.length; ia++) {
      _imageLayerMap[imgGrp.artLayers[ia].name] = imgGrp.artLayers[ia];
    }
  }

  for (var i = 0; i < data.layers.length; i++) {
    var item = data.layers[i];

    try {
      // Layer keresese map-bol (O(1))
      var layer = _imageLayerMap[item.layerName];
      if (!layer) {
        log("[JSX] WARN: Layer nem talalhato: " + item.layerName);
        _errors++;
        continue;
      }

      // Layer kivalasztasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;

      if (CONFIG.SYNC_BORDER === "true") {
        // Keretezesnel: SO open → place → cover → border action → save → close
        placePhotoInSmartObject(_doc, layer, item.photoPath, true);
        _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
      } else if (item.preCovered) {
        // Node.js-ben ELOZETESEN cover-ezett kep → CSAK replaceContents (instant)
        var descFast = new ActionDescriptor();
        descFast.putPath(charIDToTypeID("null"), new File(item.photoPath));
        descFast.putInteger(charIDToTypeID("PgNm"), 1);
        executeAction(stringIDToTypeID("placedLayerReplaceContents"), descFast, DialogModes.NO);
      } else {
        // Eredeti kep → SO open + cover resize szukseges
        placePhotoInSmartObject(_doc, layer, item.photoPath, false);
        _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
      }

      _placed++;

    } catch (e) {
      log("[JSX] HIBA (" + item.layerName + "): " + e.message);
      _errors++;
      try {
        if (app.documents.length > 1) {
          app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
      } catch (closeErr) { /* ignore */ }
      try {
        _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
      } catch (re) { /* ignore */ }
    }
  }

  log("__PLACE_RESULT__" + _placed + "/" + data.layers.length);
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // NEM hasznalunk suspendHistory-t: SO open/save/close nem kompatibilis vele
    // (az aktiv dokumentum valt SO editContent-kor).
    // Minden kepcsere kulon history lepes — igy egyesevel is visszavonhato.
    _doPlacePhotos();

    log("[JSX] Fotok behelyezese kesz: " + _placed + " sikeres, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

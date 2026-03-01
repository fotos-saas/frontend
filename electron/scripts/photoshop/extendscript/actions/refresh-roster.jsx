/**
 * refresh-roster.jsx — Nevsor frissites: felesleges layerek torlese + ujak hozzaadasa
 *
 * JSON formatum (temp fajlban, DATA_FILE_PATH):
 * {
 *   "toRemove": ["boros-reka---123", "kiss-adam---456"],
 *   "toAdd": [
 *     { "layerName": "mate-krisztina---789", "displayText": "Mate Krisztina", "group": "Students" }
 *   ]
 * }
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Globalis valtozok (suspendHistory string-eval nem lat IIFE scope-ot) ---
var _doc, _data, _removed = 0, _addedNames = 0, _addedImages = 0, _errors = 0;

/**
 * Layer torlese nev alapjan egy adott csoportbol (pl. Images/Students, Names/Teachers)
 * @param {Document} doc
 * @param {Array} groupPath  pl. ["Images", "Students"]
 * @param {string} layerName  pl. "boros-reka---123"
 * @returns {boolean} sikeres-e
 */
function _removeLayerFromGroup(doc, groupPath, layerName) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return false;

  // ArtLayers (normal layerek: text, SO, stb.)
  try {
    for (var i = group.artLayers.length - 1; i >= 0; i--) {
      if (group.artLayers[i].name === layerName) {
        group.artLayers[i].remove();
        return true;
      }
    }
  } catch (e) { /* ures csoport */ }
  return false;
}

/**
 * Meglevo SO layerek mereteit kiolvassa a megadott csoportbol.
 * Az elso talalt layer bounds-ait hasznalja referenciaként.
 */
function _getExistingSoSize(doc, groupPath) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return null;
  try {
    for (var i = 0; i < group.artLayers.length; i++) {
      var layer = group.artLayers[i];
      var bounds = layer.bounds; // [x0, y0, x1, y1]
      var w = Math.round(bounds[2].as("px") - bounds[0].as("px"));
      var h = Math.round(bounds[3].as("px") - bounds[1].as("px"));
      if (w > 10 && h > 10) {
        return { widthPx: w, heightPx: h };
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Elso text layer keresese a megadott csoportban — referencia stilushoz es poziciohoz.
 * Visszaadja a layer stilusat (font, size, color, justification) es poziciojat (bounds).
 */
function _getRefNameLayer(doc, groupPath) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return null;
  try {
    for (var i = 0; i < group.artLayers.length; i++) {
      var layer = group.artLayers[i];
      if (layer.kind === LayerKind.TEXT) {
        var ti = layer.textItem;
        var col = ti.color;
        return {
          font: ti.font,
          size: ti.size.as("pt"),
          color: { r: col.rgb.red, g: col.rgb.green, b: col.rgb.blue },
          justification: ti.justification,
          bounds: layer.bounds, // [x0, y0, x1, y1]
          position: layer.bounds[0].as("px") + "," + layer.bounds[1].as("px")
        };
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Justification enum → string (createTextLayer szamara)
 */
function _justificationToString(j) {
  if (j === Justification.LEFT) return "left";
  if (j === Justification.RIGHT) return "right";
  return "center";
}

function _doRefreshRoster() {
  // --- 1. Torles ---
  for (var r = 0; r < _data.toRemove.length; r++) {
    var removeName = _data.toRemove[r];
    var removedAny = false;
    // Kereses minden lehetseges csoportban
    var groups = ["Students", "Teachers"];
    for (var g = 0; g < groups.length; g++) {
      if (_removeLayerFromGroup(_doc, ["Images", groups[g]], removeName)) {
        removedAny = true;
      }
      if (_removeLayerFromGroup(_doc, ["Names", groups[g]], removeName)) {
        removedAny = true;
      }
    }
    if (removedAny) {
      _removed++;
      log("[JSX] Torolve: " + removeName);
    } else {
      log("[JSX] FIGYELEM: nem talalhato layer: " + removeName);
    }
  }

  // --- 2. Hozzaadas ---
  // Alapertelmezett SO meret (9x13cm @ 339 DPI)
  var defaultSize = _data.imageSizePx || { widthPx: 1228, heightPx: 1819 };

  // Referencia name layerek kiolvasasa csoportonkent (stilus + pozicio masolashoz)
  var refNames = {};
  refNames["Students"] = _getRefNameLayer(_doc, ["Names", "Students"]);
  refNames["Teachers"] = _getRefNameLayer(_doc, ["Names", "Teachers"]);

  for (var a = 0; a < _data.toAdd.length; a++) {
    var item = _data.toAdd[a];
    var groupName = item.group || "Students";

    // 2a. Name layer — meglevo stilust es poziciot masolja
    try {
      var namesGroup = getGroupByPath(_doc, ["Names", groupName]);
      if (namesGroup) {
        var ref = refNames[groupName];
        var nameOpts;
        if (ref) {
          nameOpts = {
            name: item.layerName,
            font: ref.font,
            size: ref.size,
            color: ref.color,
            alignment: _justificationToString(ref.justification)
          };
        } else {
          nameOpts = {
            name: item.layerName,
            font: CONFIG.FONT_NAME,
            size: CONFIG.FONT_SIZE,
            color: CONFIG.TEXT_COLOR,
            alignment: "center"
          };
        }

        var newTextLayer = createTextLayer(namesGroup, item.displayText, nameOpts);

        // Pozicio masolasa: a referencia layer poziciojara mozgatjuk
        if (ref) {
          var refX = ref.bounds[0].as("px");
          var refY = ref.bounds[1].as("px");
          var newBounds = newTextLayer.bounds;
          var newX = newBounds[0].as("px");
          var newY = newBounds[1].as("px");
          var dx = new UnitValue(refX - newX, "px");
          var dy = new UnitValue(refY - newY, "px");
          newTextLayer.translate(dx, dy);
        }

        _addedNames++;
      } else {
        log("[JSX] FIGYELEM: Names/" + groupName + " csoport nem talalhato");
      }
    } catch (e) {
      log("[JSX] HIBA name layer (" + item.displayText + "): " + e.message);
      _errors++;
    }

    // 2b. Image (SO placeholder) layer
    try {
      var imagesGroup = getGroupByPath(_doc, ["Images", groupName]);
      if (imagesGroup) {
        // Meglevo layer meretbol indulunk ki
        var refSize = _getExistingSoSize(_doc, ["Images", groupName]) || defaultSize;
        createSmartObjectPlaceholder(_doc, imagesGroup, {
          name: item.layerName,
          widthPx: refSize.widthPx,
          heightPx: refSize.heightPx
        });
        _addedImages++;
      } else {
        log("[JSX] FIGYELEM: Images/" + groupName + " csoport nem talalhato");
      }
    } catch (e) {
      log("[JSX] HIBA image layer (" + item.layerName + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    // --- 1. Cel dokumentum aktivalasa ---
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name);

    // --- 2. JSON beolvasas (temp fajlbol, mint a tobbi script) ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data) {
      log("[JSX] Nincs adat — kilep.");
      return;
    }

    // Default ures tombok ha hianyoznak
    if (!_data.toRemove) _data.toRemove = [];
    if (!_data.toAdd) _data.toAdd = [];

    var total = _data.toRemove.length + _data.toAdd.length;
    if (total === 0) {
      log("[JSX] Nincs teendo — kilep.");
      log("[JSX] KESZ: 0 torles, 0 hozzaadas, 0 hiba");
      return;
    }

    log("[JSX] Nevsor frissites: " + _data.toRemove.length + " torles, " + _data.toAdd.length + " hozzaadas");

    // --- 3. Torles + hozzaadas — egyetlen history lepes ---
    _doc.suspendHistory("Nevsor frissites", "_doRefreshRoster()");

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + _removed + " torolve, " + _addedNames + " nev + " + _addedImages + " kep hozzaadva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _removed + " torles, " + _addedNames + " nev, " + _addedImages + " kep, " + (_errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

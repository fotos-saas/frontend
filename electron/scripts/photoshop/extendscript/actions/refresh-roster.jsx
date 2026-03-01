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
 * Meglevo SO layerek mereteit ES poziciojat kiolvassa a megadott csoportbol.
 * Az elso talalt layer bounds-ait hasznalja referenciaként.
 */
function _getExistingSoRef(doc, groupPath) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return null;
  try {
    for (var i = 0; i < group.artLayers.length; i++) {
      var layer = group.artLayers[i];
      var bounds = layer.bounds; // [x0, y0, x1, y1]
      var w = Math.round(bounds[2].as("px") - bounds[0].as("px"));
      var h = Math.round(bounds[3].as("px") - bounds[1].as("px"));
      if (w > 10 && h > 10) {
        return {
          widthPx: w,
          heightPx: h,
          x: bounds[0].as("px"),
          y: bounds[1].as("px")
        };
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Elso text layer keresese a megadott csoportban — referencia stilushoz.
 * Visszaadja a layer stilusat (font, size, color, justification).
 */
function _getRefNameStyle(doc, groupPath) {
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
          justification: ti.justification
        };
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Referencia gap merese: meglevo Image-Name par kozotti tavolsag (px).
 * Az elso talalt Image layer aljatol az azonos nevu Name layer tetejeig meri.
 */
function _measureRefGap(doc, groupName) {
  var imgGroup = getGroupByPath(doc, ["Images", groupName]);
  var nameGroup = getGroupByPath(doc, ["Names", groupName]);
  if (!imgGroup || !nameGroup) return -1;
  try {
    for (var i = 0; i < imgGroup.artLayers.length; i++) {
      var imgLayer = imgGroup.artLayers[i];
      var imgName = imgLayer.name;
      // Keressuk az azonos nevu name layert
      for (var j = 0; j < nameGroup.artLayers.length; j++) {
        if (nameGroup.artLayers[j].name === imgName) {
          var imgBounds = imgLayer.bounds;
          var nameBounds = nameGroup.artLayers[j].bounds;
          var imgBottom = imgBounds[3].as("px");
          var nameTop = nameBounds[1].as("px");
          var gap = nameTop - imgBottom;
          if (gap >= 0) return gap;
        }
      }
    }
  } catch (e) { /* ignore */ }
  return -1;
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

  // Referencia stilus es gap kiolvasasa csoportonkent
  var refStyles = {};
  refStyles["Students"] = _getRefNameStyle(_doc, ["Names", "Students"]);
  refStyles["Teachers"] = _getRefNameStyle(_doc, ["Names", "Teachers"]);

  var refGaps = {};
  refGaps["Students"] = _measureRefGap(_doc, "Students");
  refGaps["Teachers"] = _measureRefGap(_doc, "Teachers");

  for (var a = 0; a < _data.toAdd.length; a++) {
    var item = _data.toAdd[a];
    var groupName = item.group || "Students";
    var newImageLayer = null;

    // 2a. Image (SO placeholder) layer — ELOSZOR, hogy a Name layer poziciojat tudjuk szamolni
    try {
      var imagesGroup = getGroupByPath(_doc, ["Images", groupName]);
      if (imagesGroup) {
        var soRef = _getExistingSoRef(_doc, ["Images", groupName]) || defaultSize;
        newImageLayer = createSmartObjectPlaceholder(_doc, imagesGroup, {
          name: item.layerName,
          widthPx: soRef.widthPx,
          heightPx: soRef.heightPx
        });

        // SO a [0,0]-ra jon letre — athelyezes a referencia layer poziciojara
        if (soRef.x !== undefined) {
          _doc.activeLayer = newImageLayer;
          newImageLayer.translate(
            new UnitValue(soRef.x, "px"),
            new UnitValue(soRef.y, "px")
          );
        }

        _addedImages++;
      } else {
        log("[JSX] FIGYELEM: Images/" + groupName + " csoport nem talalhato");
      }
    } catch (e) {
      log("[JSX] HIBA image layer (" + item.layerName + "): " + e.message);
      _errors++;
    }

    // 2b. Name layer — meglevo stilussal, a sajat Image layer ala pozicionalva
    try {
      var namesGroup = getGroupByPath(_doc, ["Names", groupName]);
      if (namesGroup) {
        var style = refStyles[groupName];
        var nameOpts;
        if (style) {
          nameOpts = {
            name: item.layerName,
            font: style.font,
            size: style.size,
            color: style.color,
            alignment: _justificationToString(style.justification)
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

        // Pozicionalas: a sajat Image layer ala (ha letrejott)
        if (newImageLayer) {
          var imgBounds = newImageLayer.bounds;
          var imgBottom = imgBounds[3].as("px");
          var imgCenterX = (imgBounds[0].as("px") + imgBounds[2].as("px")) / 2;

          // Gap: referencia parbol, vagy kep szelesseg 8%-a
          var gap = refGaps[groupName];
          if (gap < 0) {
            gap = Math.round((imgBounds[2].as("px") - imgBounds[0].as("px")) * 0.08);
          }

          var targetNameY = imgBottom + gap;

          // Name layer poziciojanak beallitasa
          var nameBounds = newTextLayer.bounds;
          var nameX = nameBounds[0].as("px");
          var nameY = nameBounds[1].as("px");

          // Vizszintes: a kep kozepere igazitjuk (justification alapjan)
          var align = style ? _justificationToString(style.justification) : "center";
          var targetX;
          if (align === "left") {
            targetX = imgBounds[0].as("px");
          } else if (align === "right") {
            targetX = imgBounds[2].as("px");
          } else {
            // Center: a nev kozepet a kep kozepere
            var nameW = nameBounds[2].as("px") - nameBounds[0].as("px");
            targetX = imgCenterX - nameW / 2;
          }

          var dx = new UnitValue(targetX - nameX, "px");
          var dy = new UnitValue(targetNameY - nameY, "px");
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

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
 * A pozicionalast a user vegzi: kijeloli az uj Image layereket es "Nevek igazitasa"-t nyom.
 * A JSX a vegen kijeloli az osszes uj Image layert, hogy ez konnyen menjen.
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
var _newImageLayerIds = []; // uj Image layerek ID-i (vegen kijeloleshez)

/**
 * Layer torlese nev alapjan egy adott csoportbol (pl. Images/Students, Names/Teachers)
 */
function _removeLayerFromGroup(doc, groupPath, layerName) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return false;
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
 * Meglevo SO layer VIZUALIS szelesseget kiolvassa a megadott csoportbol (elso talalt).
 * Ez az atmeretezett (vegleges) meret — a resize fazishoz kell celkent.
 */
function _getExistingLayerWidth(doc, groupPath) {
  var group = getGroupByPath(doc, groupPath);
  if (!group) return 0;
  try {
    for (var i = 0; i < group.artLayers.length; i++) {
      var layer = group.artLayers[i];
      var bounds = layer.bounds;
      var w = Math.round(bounds[2].as("px") - bounds[0].as("px"));
      if (w > 10) return w;
    }
  } catch (e) { /* ignore */ }
  return 0;
}

/**
 * Elso text layer stilusanak kiolvasasa a megadott csoportbol.
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
  // SO belso meret: UGYANAZ mint az eredeti generalaskor (9x13cm @ 339 DPI).
  // A vegleges vizualis meretet a resize fazis allitja be (lasd lentebb).
  var soCreationSize = { widthPx: 1228, heightPx: 1819 };

  // Meglevo layerek vizualis szelessege csoportonkent (resize celmerethez)
  var existingWidth = {};
  existingWidth["Students"] = _getExistingLayerWidth(_doc, ["Images", "Students"]);
  existingWidth["Teachers"] = _getExistingLayerWidth(_doc, ["Images", "Teachers"]);

  // Referencia name stilus csoportonkent
  var refStyles = {};
  refStyles["Students"] = _getRefNameStyle(_doc, ["Names", "Students"]);
  refStyles["Teachers"] = _getRefNameStyle(_doc, ["Names", "Teachers"]);

  // Uj layerek ID-i csoportonkent (resize fazishoz)
  var newLayersByGroup = {};
  newLayersByGroup["Students"] = [];
  newLayersByGroup["Teachers"] = [];

  for (var a = 0; a < _data.toAdd.length; a++) {
    var item = _data.toAdd[a];
    var groupName = item.group || "Students";

    // 2a. Image (SO placeholder) layer — NAGY meret (mint eredetileg)
    try {
      var imagesGroup = getGroupByPath(_doc, ["Images", groupName]);
      if (imagesGroup) {
        var newImgLayer = createSmartObjectPlaceholder(_doc, imagesGroup, {
          name: item.layerName,
          widthPx: soCreationSize.widthPx,
          heightPx: soCreationSize.heightPx
        });
        _addedImages++;
        try {
          _newImageLayerIds.push(newImgLayer.id);
          newLayersByGroup[groupName].push(newImgLayer);
        } catch (e2) { /* ignore */ }
      } else {
        log("[JSX] FIGYELEM: Images/" + groupName + " csoport nem talalhato");
      }
    } catch (e) {
      log("[JSX] HIBA image layer (" + item.layerName + "): " + e.message);
      _errors++;
    }

    // 2b. Name layer — meglevo stilussal (pozicionalast a user vegzi arrange-names-szel)
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
        createTextLayer(namesGroup, item.displayText, nameOpts);
        _addedNames++;
      } else {
        log("[JSX] FIGYELEM: Names/" + groupName + " csoport nem talalhato");
      }
    } catch (e) {
      log("[JSX] HIBA name layer (" + item.displayText + "): " + e.message);
      _errors++;
    }
  }

  // --- 3. Uj Image layerek atmeretezese a meglevo layerek vizualis meretere ---
  // Ugyanaz a 2-fazisu logika mint az add-image-layers.jsx-ben:
  // SO letrehozas nagy meret → resize a vegleges vizualis meretre
  var groupNames = ["Students", "Teachers"];
  for (var rg = 0; rg < groupNames.length; rg++) {
    var gn = groupNames[rg];
    var targetW = existingWidth[gn];
    if (targetW > 0 && newLayersByGroup[gn].length > 0) {
      for (var rl = 0; rl < newLayersByGroup[gn].length; rl++) {
        var resizeLayer = newLayersByGroup[gn][rl];
        try {
          selectLayerById(resizeLayer.id);
          _doc.activeLayer = resizeLayer;
          var rBounds = resizeLayer.bounds;
          var rCurrentW = rBounds[2].as("px") - rBounds[0].as("px");
          if (rCurrentW > 0 && Math.abs(rCurrentW - targetW) > 1) {
            var rCurrentH = rBounds[3].as("px") - rBounds[1].as("px");
            var rScaleW = (targetW / rCurrentW) * 100;
            var rRatio = rCurrentH / rCurrentW;
            var rScaleH = ((targetW * rRatio) / rCurrentH) * 100;
            resizeLayer.resize(rScaleW, rScaleH, AnchorPosition.MIDDLECENTER);
            log("[JSX] Resize: " + resizeLayer.name + " " + Math.round(rCurrentW) + " → " + targetW + " px");
          }
        } catch (e) {
          log("[JSX] FIGYELEM: resize sikertelen: " + resizeLayer.name + " - " + e.message);
        }
      }
    }
  }

  // --- 4. Uj Image layerek kijelolese (a user igy rogton arrange-names-t nyomhat) ---
  if (_newImageLayerIds.length > 0) {
    try {
      // Elso layer kivalasztasa
      var selDesc = new ActionDescriptor();
      var selRef = new ActionReference();
      selRef.putIdentifier(charIDToTypeID("Lyr "), _newImageLayerIds[0]);
      selDesc.putReference(charIDToTypeID("null"), selRef);
      executeAction(charIDToTypeID("slct"), selDesc, DialogModes.NO);

      // Tobbi hozzaadasa a kijeloleshez
      for (var s = 1; s < _newImageLayerIds.length; s++) {
        var addDesc = new ActionDescriptor();
        var addRef = new ActionReference();
        addRef.putIdentifier(charIDToTypeID("Lyr "), _newImageLayerIds[s]);
        addDesc.putReference(charIDToTypeID("null"), addRef);
        addDesc.putEnumerated(
          stringIDToTypeID("selectionModifier"),
          stringIDToTypeID("selectionModifierType"),
          stringIDToTypeID("addToSelection")
        );
        executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
      }
      log("[JSX] " + _newImageLayerIds.length + " uj Image layer kijelolve");
    } catch (e) {
      log("[JSX] FIGYELEM: layer kijeloles sikertelen: " + e.message);
    }
  }
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name);

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);
    if (!_data) {
      log("[JSX] Nincs adat — kilep.");
      return;
    }

    if (!_data.toRemove) _data.toRemove = [];
    if (!_data.toAdd) _data.toAdd = [];

    var total = _data.toRemove.length + _data.toAdd.length;
    if (total === 0) {
      log("[JSX] Nincs teendo — kilep.");
      log("[JSX] KESZ: 0 torles, 0 hozzaadas, 0 hiba");
      return;
    }

    log("[JSX] Nevsor frissites: " + _data.toRemove.length + " torles, " + _data.toAdd.length + " hozzaadas");

    _doc.suspendHistory("Nevsor frissites", "_doRefreshRoster()");

    log("[JSX] KESZ: " + _removed + " torolve, " + _addedNames + " nev + " + _addedImages + " kep hozzaadva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _removed + " torles, " + _addedNames + " nev, " + _addedImages + " kep, " + (_errors + 1) + " hiba");
  }
})();

_logLines.join("\n");

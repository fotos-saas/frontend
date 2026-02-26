/**
 * restore-layout.jsx — Snapshot visszaallitas (v3)
 *
 * JSON temp fajlbol olvassa a layers tombot es visszaallitja
 * a layerek pozicioit. Text layereknel text tartalom + igazitas is.
 *
 * Layer keresesi logika:
 *   1. Elsodleges: layerId — Photoshop layer.id egyedi azonosito
 *   2. Fallback: layerName + groupPath — ha az ID nem letezik
 *
 * Opcionalis: restoreGroups — csak megadott csoport prefixek layereit allitja vissza
 *
 * v2 backward compat: persons[] → automatikus v3 layers[] konverzio
 *
 * Egy Undo lepes: suspendHistory()-vel egybefogva.
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "layers": [
 *     {
 *       "layerId": 142,
 *       "layerName": "kiss-janos---42",
 *       "groupPath": ["Images", "Students"],
 *       "x": 100, "y": 200, "width": 472, "height": 708,
 *       "kind": "normal"
 *     }
 *   ],
 *   "restoreGroups": [["Images"], ["Names"]]  // opcionalis
 * }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Globalis valtozok ---
var _doc;
var _skipped = 0;
var _restored = 0;
var _snapshotData = null;

// --- Layer bounds EFFEKTEK NELKUL (boundsNoEffects) ---
function _getBoundsNoEffects(layer) {
  selectLayerById(layer.id);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);

  var boundsKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
  } else {
    b = desc.getObjectValue(stringIDToTypeID("bounds"));
  }

  return {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
}

// --- Layer poziciojanak visszaallitasa a mentett koordinatakra ---
function _restoreLayerPosition(layer, targetX, targetY) {
  var bnfe = _getBoundsNoEffects(layer);
  var currentX = Math.round(bnfe.left);
  var currentY = Math.round(bnfe.top);

  var dx = targetX - currentX;
  var dy = targetY - currentY;

  if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
    layer.translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
  }
}

// --- Text layer tartalom es igazitas visszaallitasa ---
function _restoreTextContent(layer, text, justification) {
  if (layer.kind !== LayerKind.TEXT) return;

  try {
    var textItem = layer.textItem;

    // Szoveg tartalom visszaallitasa
    if (text !== undefined && text !== null) {
      textItem.contents = text;
    }

    // Igazitas visszaallitasa
    if (justification) {
      var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
      if (alignMap[justification]) {
        textItem.justification = alignMap[justification];
      }
    }
  } catch (e) {
    log("[JSX] WARN: Text tartalom visszaallitasa sikertelen (" + layer.name + "): " + e.message);
  }
}

// --- Layer keresese nev alapjan egy containerben (rekurziv) ---
function _findLayerByName(container, layerName) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === layerName) {
        return container.artLayers[i];
      }
    }
  } catch (e) { /* nincs artLayers */ }

  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      var found = _findLayerByName(container.layerSets[j], layerName);
      if (found) return found;
    }
  } catch (e) { /* nincs layerSets */ }

  return null;
}

// --- Layer keresese layerId alapjan (ActionManager) ---
// Visszaadja a layert ha letezik, vagy null ha nem
function _findLayerById(doc, layerId) {
  try {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc = executeActionGet(ref);
    // Ha nem dob hibat → a layer letezik, kivalasztjuk
    selectLayerById(layerId);
    return doc.activeLayer;
  } catch (e) {
    return null;
  }
}

// --- Csoport cache (ES3 — parhuzamos tombok) ---
// A getGroupByPath eredmenyeit cache-eljuk, hogy ne keressuk ujra
var _groupCacheKeys = [];
var _groupCacheValues = [];

function _getCachedGroup(doc, groupPath) {
  // Path → string kulcs (ES3: nincs Array.join sajnos... de van)
  var key = groupPath.join("/");

  // Cache kereses
  for (var i = 0; i < _groupCacheKeys.length; i++) {
    if (_groupCacheKeys[i] === key) return _groupCacheValues[i];
  }

  // Uj kereses + cache-eles
  var grp = getGroupByPath(doc, groupPath);
  _groupCacheKeys.push(key);
  _groupCacheValues.push(grp);
  return grp;
}

// --- Ellenorzes: a layer groupPath megfelel-e a restoreGroups szuronek ---
// restoreGroups: tomb tombje — pl. [["Images"], ["Names"]]
// groupPath: string tomb — pl. ["Images", "Students"]
// Igaz ha a groupPath VALAMELYIK restoreGroups prefixszel kezdodik,
// VAGY ha a groupPath ures (root layer) es a restoreGroups tartalmaz ures tombot
function _matchesRestoreGroups(groupPath, restoreGroups) {
  for (var i = 0; i < restoreGroups.length; i++) {
    var prefix = restoreGroups[i];

    // Ures prefix → root layerek
    if (prefix.length === 0 && groupPath.length === 0) return true;

    // Prefix match: a groupPath elso N eleme megegyezik
    if (prefix.length <= groupPath.length) {
      var match = true;
      for (var j = 0; j < prefix.length; j++) {
        if (prefix[j] !== groupPath[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

// --- v2 → v3 konverzio (backward compat) ---
// v2 formatum: persons[{layerName, image:{x,y,w,h}, nameLayer?:{x,y,text,justification}}]
// v3 formatum: layers[{layerId, layerName, groupPath, x, y, width, height, kind, text?, justification?}]
function _convertV2ToLayers(persons) {
  var layers = [];
  for (var i = 0; i < persons.length; i++) {
    var p = persons[i];
    var personType = p.type || "student";

    // Image layer (ha van image adat)
    if (p.image) {
      layers.push({
        layerId: 0, // v2-nek nincs layerId → fallback keresest fog hasznalni
        layerName: p.layerName,
        groupPath: ["Images", personType === "teacher" ? "Teachers" : "Students"],
        x: p.image.x,
        y: p.image.y,
        width: p.image.width,
        height: p.image.height,
        kind: "normal"
      });
    }

    // Name layer (ha van nameLayer adat)
    if (p.nameLayer) {
      layers.push({
        layerId: 0,
        layerName: p.layerName,
        groupPath: ["Names", personType === "teacher" ? "Teachers" : "Students"],
        x: p.nameLayer.x,
        y: p.nameLayer.y,
        width: p.nameLayer.width || 0,
        height: p.nameLayer.height || 0,
        kind: "text",
        text: p.nameLayer.text,
        justification: p.nameLayer.justification
      });
    }
  }
  return layers;
}

// --- Rekurziv layer kereses nev alapjan (unlink/relink-hez) ---
function _findLayersByNames(container, targetNames, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var layer = container.artLayers[i];
      for (var n = 0; n < targetNames.length; n++) {
        if (layer.name === targetNames[n]) {
          result.push(layer);
          break;
        }
      }
    }
  } catch (e) { /* nincs artLayers */ }
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _findLayersByNames(container.layerSets[j], targetNames, result);
    }
  } catch (e) { /* nincs layerSets */ }
}

// --- Tobb layer kijelolese ID alapjan (ActionManager) — relink-hez ---
function _selectMultipleLayersById(layerIds) {
  if (layerIds.length === 0) return;
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerIds[0]);
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
  for (var i = 1; i < layerIds.length; i++) {
    var addDesc = new ActionDescriptor();
    var addRef = new ActionReference();
    addRef.putIdentifier(charIDToTypeID("Lyr "), layerIds[i]);
    addDesc.putReference(charIDToTypeID("null"), addRef);
    addDesc.putEnumerated(
      stringIDToTypeID("selectionModifier"),
      stringIDToTypeID("selectionModifierType"),
      stringIDToTypeID("addToSelection")
    );
    executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
  }
}

// --- Linked layerek unlinkelese nev alapjan ---
function _unlinkByNames(doc, layerNames) {
  var found = [];
  _findLayersByNames(doc, layerNames, found);
  var count = 0;
  for (var i = 0; i < found.length; i++) {
    try { found[i].unlink(); count++; } catch (e) { /* nem linkelt */ }
  }
  return count;
}

// --- Linked layerek visszalinkelese nev alapjan ---
// Nev alapjan: adott layerName osszes elofordulasa (Images + Names) ossze lesz linkelve
function _relinkByNames(doc, layerNames) {
  for (var n = 0; n < layerNames.length; n++) {
    var found = [];
    _findLayersByNames(doc, [layerNames[n]], found);
    if (found.length < 2) continue;
    var ids = [];
    for (var i = 0; i < found.length; i++) { ids.push(found[i].id); }
    _selectMultipleLayersById(ids);
    var linkDesc = new ActionDescriptor();
    var linkRef = new ActionReference();
    linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    linkDesc.putReference(charIDToTypeID("null"), linkRef);
    executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
  }
}

// --- Fo visszaallitasi logika ---
function _doRestore() {
  if (!_snapshotData) {
    log("[JSX] HIBA: _snapshotData null/undefined");
    return;
  }

  // Linked layerek kezelese — unlink a mozgatas elott
  var linkedNames = _snapshotData.linkedLayerNames || null;
  var hasLinked = linkedNames && linkedNames.length > 0;
  if (hasLinked) {
    var unlinked = _unlinkByNames(_doc, linkedNames);
    log("[JSX] Unlink: " + unlinked + " layer");
  }

  // v2 backward compat: persons → layers konverzio
  var layers = _snapshotData.layers;
  if (!layers && _snapshotData.persons) {
    log("[JSX] v2 snapshot detektalva — konverzio v3 formátumra");
    layers = _convertV2ToLayers(_snapshotData.persons);
  }

  if (!layers || layers.length === 0) {
    log("[JSX] Nincs layer a snapshot-ban");
    return;
  }

  // Opcionalis restoreGroups szuro
  var restoreGroups = _snapshotData.restoreGroups || null;
  var hasFilter = restoreGroups && restoreGroups.length > 0;

  log("[JSX] Snapshot visszaallitas indul: " + layers.length + " layer" +
    (hasFilter ? " (szurt: " + restoreGroups.length + " csoport prefix)" : ""));

  // Group cache reset
  _groupCacheKeys = [];
  _groupCacheValues = [];

  for (var i = 0; i < layers.length; i++) {
    var layerData = layers[i];
    var groupPath = layerData.groupPath || [];

    // restoreGroups szuro — ha megadva, csak matching layerek
    if (hasFilter && !_matchesRestoreGroups(groupPath, restoreGroups)) {
      continue;
    }

    // 1. Layer keresese layerId alapjan (elsodleges)
    var layer = null;
    if (layerData.layerId && layerData.layerId > 0) {
      layer = _findLayerById(_doc, layerData.layerId);
    }

    // 2. Fallback: layerName + groupPath alapjan
    if (!layer && layerData.layerName) {
      var searchContainer = _doc;
      if (groupPath.length > 0) {
        var grp = _getCachedGroup(_doc, groupPath);
        if (grp) searchContainer = grp;
      }
      layer = _findLayerByName(searchContainer, layerData.layerName);
    }

    if (!layer) {
      log("[JSX] WARN: Layer nem talalhato: " + layerData.layerName +
        " (id:" + (layerData.layerId || "?") + ", path:" + groupPath.join("/") + ")");
      _skipped++;
      continue;
    }

    // Pozicio visszaallitasa
    try {
      _restoreLayerPosition(layer, layerData.x, layerData.y);

      // Text layerek: text + justification visszaallitasa
      if (layerData.kind === "text") {
        _restoreTextContent(layer, layerData.text, layerData.justification);
      }

      // Lathatosag visszaallitasa (ha a snapshot tartalmazza)
      if (layerData.visible !== undefined) {
        layer.visible = layerData.visible;
      }

      _restored++;
    } catch (e) {
      log("[JSX] WARN: Layer visszaallitas sikertelen (" + layerData.layerName + "): " + e.message);
      _skipped++;
    }
  }

  // Linked layerek visszalinkelese a mozgatas utan
  if (hasLinked) {
    _relinkByNames(_doc, linkedNames);
    log("[JSX] Relink: " + linkedNames.length + " layerName visszalinkelve");
  }

  log("[JSX] Visszaallitas kesz: " + _restored + " layer visszaallitva, " + _skipped + " kihagyva");
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // JSON adat beolvasasa temp fajlbol
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    // Globalis valtozoba mentjuk — suspendHistory string-eval innen olvassa
    _snapshotData = readJsonFile(args.dataFilePath);

    // Ruler PIXELS-re
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Egyetlen Undo lepes — parameter nelkuli hivas (a tobbi JSX mintajara)
    var historyName = (_snapshotData && _snapshotData.historyName) ? _snapshotData.historyName : "Snapshot visszaállítás";
    _doc.suspendHistory(historyName, "_doRestore()");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] Snapshot visszaallitas befejezve");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

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

// --- Fo visszaallitasi logika ---
function _doRestore() {
  if (!_snapshotData) {
    log("[JSX] HIBA: _snapshotData null/undefined");
    return;
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

      _restored++;
    } catch (e) {
      log("[JSX] WARN: Layer visszaallitas sikertelen (" + layerData.layerName + "): " + e.message);
      _skipped++;
    }
  }

  log("[JSX] Visszaallitas kesz: " + _restored + " layer visszaallitva, " + _skipped + " kihagyva");
}

(function () {
  try {
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum!");
    }
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
    _doc.suspendHistory("Snapshot visszaállítás", "_doRestore()");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] Snapshot visszaallitas befejezve");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

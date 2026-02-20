/**
 * apply-template.jsx — Sablon alkalmazas (layerek mozgatasa)
 *
 * JSON temp fajlbol olvassa a moves[] tombot es minden layert
 * a megadott poziciora mozgat. A layereket layerName + groupPath
 * alapjan keresi (nem layerId, mert masik dokumentum).
 *
 * Text layereknel az igazitas (justification) is beallithato.
 *
 * Egy Undo lepes: suspendHistory()-vel egybefogva.
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "moves": [
 *     {
 *       "layerName": "kiss-janos---42",
 *       "groupPath": ["Images", "Students"],
 *       "targetX": 100,
 *       "targetY": 200,
 *       "justification": "center"
 *     }
 *   ]
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
var _moved = 0;
var _movesData = null;

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

// --- Layer keresese nev alapjan egy containerben ---
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

// --- Csoport cache (ES3 — parhuzamos tombok) ---
var _groupCacheKeys = [];
var _groupCacheValues = [];

function _getCachedGroup(doc, groupPath) {
  var key = groupPath.join("/");
  for (var i = 0; i < _groupCacheKeys.length; i++) {
    if (_groupCacheKeys[i] === key) return _groupCacheValues[i];
  }
  var grp = getGroupByPath(doc, groupPath);
  _groupCacheKeys.push(key);
  _groupCacheValues.push(grp);
  return grp;
}

// --- Text layer igazitas beallitasa ---
function _setJustification(layer, justification) {
  if (layer.kind !== LayerKind.TEXT) return;
  try {
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[justification]) {
      layer.textItem.justification = alignMap[justification];
    }
  } catch (e) {
    log("[JSX] WARN: Igazitas beallitas sikertelen (" + layer.name + "): " + e.message);
  }
}

// --- Fo mozgatasi logika ---
function _doApplyMoves() {
  if (!_movesData || !_movesData.moves) {
    log("[JSX] HIBA: _movesData null/undefined");
    return;
  }

  var moves = _movesData.moves;
  if (moves.length === 0) {
    log("[JSX] Nincs mozgatando layer");
    return;
  }

  log("[JSX] Sablon alkalmazas indul: " + moves.length + " mozgatas");

  // Group cache reset
  _groupCacheKeys = [];
  _groupCacheValues = [];

  for (var i = 0; i < moves.length; i++) {
    var move = moves[i];
    var groupPath = move.groupPath || [];

    // Layer keresese layerName + groupPath alapjan
    var layer = null;
    var searchContainer = _doc;
    if (groupPath.length > 0) {
      var grp = _getCachedGroup(_doc, groupPath);
      if (grp) searchContainer = grp;
    }
    layer = _findLayerByName(searchContainer, move.layerName);

    if (!layer) {
      log("[JSX] WARN: Layer nem talalhato: " + move.layerName + " (path:" + groupPath.join("/") + ")");
      _skipped++;
      continue;
    }

    // Pozicio mozgatasa
    try {
      var bnfe = _getBoundsNoEffects(layer);
      var currentX = Math.round(bnfe.left);
      var currentY = Math.round(bnfe.top);

      var dx = move.targetX - currentX;
      var dy = move.targetY - currentY;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        layer.translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
      }

      // Text layer igazitas (ha megadva)
      if (move.justification) {
        _setJustification(layer, move.justification);
      }

      _moved++;
    } catch (e) {
      log("[JSX] WARN: Layer mozgatas sikertelen (" + move.layerName + "): " + e.message);
      _skipped++;
    }
  }

  log("[JSX] Sablon alkalmazas kesz: " + _moved + " layer mozgatva, " + _skipped + " kihagyva");
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
    _movesData = readJsonFile(args.dataFilePath);

    // Ruler PIXELS-re
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Egyetlen Undo lepes
    _doc.suspendHistory("Sablon alkalmazás", "_doApplyMoves()");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] Sablon alkalmazas befejezve");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

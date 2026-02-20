/**
 * restore-layout.jsx — Snapshot visszaallitas
 *
 * JSON temp fajlbol olvassa a persons tombot es visszaallitja
 * a layerek pozicioit + nev layerek text tartalmat es igazitasat.
 *
 * Egy Undo lepes: suspendHistory()-vel egybefogva.
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "persons": [
 *     {
 *       "layerName": "kiss-janos---42",
 *       "image": { "x": 100, "y": 200, "width": 472, "height": 708 },
 *       "nameLayer": { "x": 85, "y": 920, "text": "Kiss\rJanos", "justification": "center" }
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
var _restored = 0;
var _snapshotData = null;

// --- Layer keresese nev alapjan a teljes dokumentumban (rekurziv) ---
function _findLayerByName(container, layerName) {
  // artLayers keresese
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === layerName) {
        return container.artLayers[i];
      }
    }
  } catch (e) { /* nincs artLayers */ }

  // Rekurziv keresese layerSets-ben
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      var found = _findLayerByName(container.layerSets[j], layerName);
      if (found) return found;
    }
  } catch (e) { /* nincs layerSets */ }

  return null;
}

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

// --- Fo visszaallitasi logika ---
function _doRestore(data) {
  var persons = data.persons;
  if (!persons || persons.length === 0) {
    log("[JSX] Nincs szemely a snapshot-ban");
    return;
  }

  log("[JSX] Snapshot visszaallitas indul: " + persons.length + " szemely");

  for (var i = 0; i < persons.length; i++) {
    var p = persons[i];
    var layerName = p.layerName;

    // Image layer visszaallitasa
    if (p.image) {
      var imgLayer = _findLayerByName(_doc, layerName);
      if (imgLayer) {
        try {
          _restoreLayerPosition(imgLayer, p.image.x, p.image.y);
          _restored++;
        } catch (e) {
          log("[JSX] WARN: Image layer visszaallitas sikertelen (" + layerName + "): " + e.message);
          _skipped++;
        }
      } else {
        log("[JSX] WARN: Image layer nem talalhato: " + layerName);
        _skipped++;
      }
    }

    // Name layer visszaallitasa
    if (p.nameLayer) {
      // Nev layer neve azonos a kep layer nevevel (Names/ csoportban)
      var nameLayer = null;

      // Keresese a Names csoportokban
      var nameStudents = getGroupByPath(_doc, ["Names", "Students"]);
      var nameTeachers = getGroupByPath(_doc, ["Names", "Teachers"]);

      if (nameStudents) {
        nameLayer = _findLayerByName(nameStudents, layerName);
      }
      if (!nameLayer && nameTeachers) {
        nameLayer = _findLayerByName(nameTeachers, layerName);
      }

      if (nameLayer) {
        try {
          _restoreLayerPosition(nameLayer, p.nameLayer.x, p.nameLayer.y);
          _restoreTextContent(nameLayer, p.nameLayer.text, p.nameLayer.justification);
          _restored++;
        } catch (e) {
          log("[JSX] WARN: Name layer visszaallitas sikertelen (" + layerName + "): " + e.message);
          _skipped++;
        }
      } else {
        log("[JSX] WARN: Name layer nem talalhato: " + layerName);
        _skipped++;
      }
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

    // Globalis valtozoba mentjuk — suspendHistory eval a globalis scope-ban fut!
    _snapshotData = readJsonFile(args.dataFilePath);

    // Ruler PIXELS-re
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Egy Undo lepes: suspendHistory egyetlen history bejegyzes
    _doc.suspendHistory("Snapshot visszaállítás", "_doRestore(_snapshotData)");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] Snapshot visszaallitas befejezve");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

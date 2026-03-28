/**
 * update-positions.jsx — Pozicio (beosztás) layerek frissitese/letrehozasa/torlese
 *
 * FONTOS: A nev layereket NEM modositja! Csak referenciaként olvassa ki a poziciojukat.
 *
 * Minden szemelyre:
 * 1. Pozicio layer kezelese:
 *    - Ha van pozicio szoveg → letrehozas vagy frissites
 *    - Ha nincs pozicio → layer torlese (ha letezik)
 * 2. Pozicio layer pozicionalasa: nev layer alja + gap
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "persons": [
 *     { "layerName": "kiss-janos---42", "displayText": "Kiss Janos", "position": "Igazgato", "group": "Students" }
 *   ],
 *   "textAlign": "center",
 *   "nameGapCm": 0.5,
 *   "positionGapCm": 0.15,
 *   "positionFontSize": 18
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
var _doc, _data, _dpi;
var _updated = 0, _created = 0, _deleted = 0, _errors = 0;

// --- Cache-ek (teljesitmeny) ---
var _baselineOffsets = {};  // font meret → offset
var _boundsCache = {};      // layer id → { left, top, right, bottom }
var _groupCache = {};       // path string → group ref

// --- cm → px konverzio ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Layer bounds EFFEKTEK NELKUL (CACHE-ELT) ---
function _getBoundsNoEffects(layer) {
  var cacheKey = String(layer.id);
  if (_boundsCache[cacheKey]) return _boundsCache[cacheKey];

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

  var result = {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
  _boundsCache[cacheKey] = result;
  return result;
}

// --- Group keresese (CACHE-ELT) ---
function _getGroup(pathArray) {
  var key = pathArray.join("/");
  if (_groupCache[key] !== undefined) return _groupCache[key];
  var grp = getGroupByPath(_doc, pathArray);
  _groupCache[key] = grp || null;
  return _groupCache[key];
}

// --- Baseline offset meres adott font merethez ---
function _measureBaselineOffset(container, fontSize) {
  var key = String(fontSize);
  if (_baselineOffsets[key] !== undefined) return _baselineOffsets[key];

  var refLayer = _doc.artLayers.add();
  refLayer.kind = LayerKind.TEXT;
  refLayer.name = "__ref_measure_" + key + "__";
  var ti = refLayer.textItem;
  ti.contents = "Hg";
  ti.font = CONFIG.FONT_NAME;
  ti.size = new UnitValue(fontSize, "pt");
  ti.justification = Justification.LEFT;
  refLayer.move(container, ElementPlacement.INSIDE);

  var posY = ti.position[1].as("px");
  var b = _getBoundsNoEffects(refLayer);
  var offset = posY - b.top;

  // Meres utan toroljuk — ne maradjon a cache-ben sem
  delete _boundsCache[String(refLayer.id)];
  refLayer.remove();
  _baselineOffsets[key] = offset;
  log("[JSX] Baseline offset (" + fontSize + "pt): " + offset + "px");
  return offset;
}

// --- Layer keresese nev+csoport alapjan (cache-elt group-pal) ---
function _findImageLayer(layerName) {
  var paths = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < paths.length; g++) {
    var grp = _getGroup(paths[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      if (grp.artLayers[i].name === layerName) return grp.artLayers[i];
    }
  }
  return null;
}

function _findNameLayer(layerName, group) {
  var grp = _getGroup(["Names", group]);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === layerName) return grp.artLayers[i];
  }
  return null;
}

function _findPositionLayer(layerName, group) {
  var grp = _getGroup(["Positions", group]);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === layerName) return grp.artLayers[i];
  }
  return null;
}

// --- Positions csoport biztositasa (letrehozas ha nincs) ---
function _ensurePositionsGroup(group) {
  var posRoot = _getGroup(["Positions"]);
  if (!posRoot) {
    posRoot = _doc.layerSets.add();
    posRoot.name = "Positions";
    _groupCache["Positions"] = posRoot;
    log("[JSX] Positions csoport letrehozva");
  }

  // Al-csoport (Students/Teachers)
  var subKey = "Positions/" + group;
  if (_groupCache[subKey]) return _groupCache[subKey];

  var subGrp = null;
  try {
    for (var i = 0; i < posRoot.layerSets.length; i++) {
      if (posRoot.layerSets[i].name === group) {
        subGrp = posRoot.layerSets[i];
        break;
      }
    }
  } catch (e) { /* no layerSets */ }

  if (!subGrp) {
    subGrp = posRoot.layerSets.add();
    subGrp.name = group;
    log("[JSX] Positions/" + group + " csoport letrehozva");
  }

  _groupCache[subKey] = subGrp;
  return subGrp;
}

// --- Egy szemely feldolgozasa ---
function _processPerson(person) {
  var layerName = person.layerName;
  var group = person.group;
  var positionText = person.position || null;

  var textAlign = _data.textAlign || "center";
  var nameGapCm = _data.nameGapCm || 0.5;
  var posGapCm = _data.positionGapCm || CONFIG.POSITION_GAP_CM;
  var posFontSize = _data.positionFontSize || CONFIG.POSITION_FONT_SIZE;

  // 1. Kep layer keresese
  var imageLayer = _findImageLayer(layerName);
  if (!imageLayer) {
    log("[JSX] WARN: Nincs kep layer: " + layerName);
    _errors++;
    return;
  }

  // 2. Pozicio layer kezelese
  var posLayer = _findPositionLayer(layerName, group);

  if (positionText) {
    var posContainer = _ensurePositionsGroup(group);

    if (posLayer) {
      // Letezo pozicio layer → szoveg frissites
      try {
        var posTextItem = posLayer.textItem;
        if (posTextItem.contents !== positionText) {
          posTextItem.contents = positionText;
          // Bounds cache invalidalas mert a szoveg valtozott
          delete _boundsCache[String(posLayer.id)];
        }
        var posAlignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
        if (posAlignMap[textAlign]) {
          posTextItem.justification = posAlignMap[textAlign];
        }
        _updated++;
      } catch (e) {
        log("[JSX] WARN: Pozicio frissites sikertelen (" + layerName + "): " + e.message);
        _errors++;
        return;
      }
    } else {
      // Uj pozicio layer letrehozasa
      try {
        posLayer = createTextLayer(posContainer, positionText, {
          name: layerName,
          font: CONFIG.FONT_NAME,
          size: posFontSize,
          color: CONFIG.TEXT_COLOR,
          alignment: textAlign
        });
        _created++;
      } catch (e) {
        log("[JSX] WARN: Pozicio layer letrehozas sikertelen (" + layerName + "): " + e.message);
        _errors++;
        return;
      }
    }

    // 3. Pozicio layer pozicionalasa
    try {
      var posBaselineOffset = _measureBaselineOffset(posContainer, posFontSize);

      // Nev layer alja — TENYLEGES bounds-bol (nev layert NEM modositjuk)
      var nameLayer = _findNameLayer(layerName, group);
      var nameBottom;
      var imgBounds = _getBoundsNoEffects(imageLayer); // 1x lekerdezve, cache-elve
      if (nameLayer) {
        var nameBounds = _getBoundsNoEffects(nameLayer);
        nameBottom = nameBounds.bottom;
      } else {
        nameBottom = imgBounds.bottom + _cm2px(nameGapCm);
      }

      var posGapPx = _cm2px(posGapCm);
      var posBoundsTop = nameBottom + posGapPx;
      var posBaselineY = posBoundsTop + posBaselineOffset;

      // Vizszintes: kep kozepetol (imgBounds mar cache-bol jon)
      var posX;
      if (textAlign === "left") {
        posX = imgBounds.left;
      } else if (textAlign === "right") {
        posX = imgBounds.right;
      } else {
        posX = (imgBounds.left + imgBounds.right) / 2;
      }

      selectLayerById(posLayer.id);
      posLayer.textItem.position = [
        new UnitValue(Math.round(posX), "px"),
        new UnitValue(Math.round(posBaselineY), "px")
      ];
    } catch (e) {
      log("[JSX] WARN: Pozicio pozicionalas sikertelen (" + layerName + "): " + e.message);
      _errors++;
    }

  } else {
    // Nincs pozicio szoveg → torles ha letezik
    if (posLayer) {
      try {
        posLayer.remove();
        _deleted++;
      } catch (e) {
        log("[JSX] WARN: Pozicio torles sikertelen (" + layerName + "): " + e.message);
        _errors++;
      }
    }
  }
}

// --- Fo fuggveny ---
function _doUpdatePositions() {
  var persons = _data.persons || [];
  log("[JSX] Szemelyek szama: " + persons.length);

  for (var i = 0; i < persons.length; i++) {
    _processPerson(persons[i]);
  }
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);
    if (!_data || !_data.persons) {
      log("[JSX] Nincs adat — kilep.");
      return;
    }

    _dpi = _doc.resolution;

    _doc.suspendHistory("Poziciok frissitese", "_doUpdatePositions()");

    log("[JSX] KESZ: " + _created + " letrehozva, " + _updated + " frissitve, " + _deleted + " torolve, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

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
 *   "nameBreakAfter": 1,
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

// --- Baseline offset cache: font meret → offset ---
var _baselineOffsets = {};

// --- Nev tordeles (breakAfter) — azonos az arrange-names.jsx-bol ---
function _breakName(name, breakAfter) {
  if (breakAfter <= 0) return name;
  var words = name.split(" ");
  if (words.length < 2) return name;
  function isPrefix(w) { return w.replace(/\./g, "").length <= 2; }
  var realCount = 0;
  for (var c = 0; c < words.length; c++) {
    if (!isPrefix(words[c])) realCount++;
  }
  if (realCount < 3) return name;
  var hyphenIndex = -1;
  for (var h = 0; h < words.length; h++) {
    if (words[h].indexOf("-") !== -1) { hyphenIndex = h; break; }
  }
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(" ") + "\r" + words.slice(hyphenIndex + 1).join(" ");
  }
  var realWordCount = 0;
  var breakIndex = -1;
  for (var i = 0; i < words.length; i++) {
    if (!isPrefix(words[i])) realWordCount++;
    if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
  }
  if (breakIndex === -1) return name;
  return words.slice(0, breakIndex).join(" ") + "\r" + words.slice(breakIndex).join(" ");
}

// --- Nev kiolvasasa a text layer-bol (sortoresek nelkul) ---
function _getPlainName(textItem) {
  var raw = textItem.contents;
  return raw.replace(/[\r\n]/g, " ").replace(/  +/g, " ");
}

// --- cm → px konverzio ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Layer bounds EFFEKTEK NELKUL ---
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

  refLayer.remove();
  _baselineOffsets[key] = offset;
  log("[JSX] Baseline offset (" + fontSize + "pt): " + offset + "px");
  return offset;
}

// --- Kep layer keresese nev alapjan ---
function _findImageLayer(layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(_doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      if (grp.artLayers[i].name === layerName) {
        return grp.artLayers[i];
      }
    }
  }
  return null;
}

// --- Nev layer keresese ---
function _findNameLayer(layerName, group) {
  var grp = getGroupByPath(_doc, ["Names", group]);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === layerName) {
      return grp.artLayers[i];
    }
  }
  return null;
}

// --- Pozicio layer keresese ---
function _findPositionLayer(layerName, group) {
  var grp = getGroupByPath(_doc, ["Positions", group]);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === layerName) {
      return grp.artLayers[i];
    }
  }
  return null;
}

// --- Positions csoport biztositasa (letrehozas ha nincs) ---
function _ensurePositionsGroup(group) {
  // Fo Positions csoport
  var posRoot = getGroupByPath(_doc, ["Positions"]);
  if (!posRoot) {
    posRoot = _doc.layerSets.add();
    posRoot.name = "Positions";
    log("[JSX] Positions csoport letrehozva");
  }

  // Al-csoport (Students/Teachers)
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

  return subGrp;
}

// --- Egy szemely feldolgozasa ---
function _processPerson(person) {
  var layerName = person.layerName;
  var group = person.group; // "Students" vagy "Teachers"
  var displayText = person.displayText;
  var positionText = person.position || null;

  var textAlign = _data.textAlign || "center";
  var nameGapCm = _data.nameGapCm || 0.5;
  var posGapCm = _data.positionGapCm || CONFIG.POSITION_GAP_CM;
  var posFontSize = _data.positionFontSize || CONFIG.POSITION_FONT_SIZE;

  // 1. Nev layer keresese
  var nameLayer = _findNameLayer(layerName, group);

  // 2. Kep layer keresese (pozicionalashoz)
  var imageLayer = _findImageLayer(layerName);
  if (!imageLayer) {
    log("[JSX] WARN: Nincs kep layer: " + layerName);
    _errors++;
    return;
  }

  // 3. Nev layert NEM bantjuk — csak referenciakent hasznaljuk a pozicio elhelyezesehez

  // 4. Pozicio layer kezelese
  var posLayer = _findPositionLayer(layerName, group);

  if (positionText) {
    // Van pozicio szoveg
    var posContainer = _ensurePositionsGroup(group);

    if (posLayer) {
      // Letezo pozicio layer → szoveg frissites
      try {
        var posTextItem = posLayer.textItem;
        if (posTextItem.contents !== positionText) {
          posTextItem.contents = positionText;
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

    // Pozicio layer pozicionalasa: nev alja + gap (vagy kep alja + nameGap + nevMagassag + posGap)
    try {
      var posBaselineOffset = _measureBaselineOffset(posContainer, posFontSize);

      // Nev layer alja — a nev layer TENYLEGES bounds-jabol (nem szamolva)
      // Igy nem bantjuk a nev poziciojat, csak referenciat kapunk
      var nameBottom;
      if (nameLayer) {
        var nameBounds = _getBoundsNoEffects(nameLayer);
        nameBottom = nameBounds.bottom;
      } else {
        var imgB = _getBoundsNoEffects(imageLayer);
        nameBottom = imgB.bottom + _cm2px(nameGapCm);
      }

      var posGapPx = _cm2px(posGapCm);
      var posBoundsTop = nameBottom + posGapPx;
      var posBaselineY = posBoundsTop + posBaselineOffset;

      // Vizszintes: kep kozepetol (ugyanugy mint a nev)
      var imgB2 = _getBoundsNoEffects(imageLayer);
      var posX;
      if (textAlign === "left") {
        posX = imgB2.left;
      } else if (textAlign === "right") {
        posX = imgB2.right;
      } else {
        posX = (imgB2.left + imgB2.right) / 2;
      }

      selectLayerById(posLayer.id);
      _doc.activeLayer = posLayer;
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

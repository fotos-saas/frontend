/**
 * arrange-names.jsx — Nev layerek szovegenek frissitese (tordeles) es pozicionalasa a kepek ala
 *
 * Minden nev layert:
 * 1. Szoveg frissites: breakAfter alapjan sortores (\r) hozzaadas
 * 2. Pozicionalas: a hozza tartozo kep ala, a beallitott gap es text igazitas alapjan
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "nameGapCm": 0.5,
 *   "textAlign": "center",
 *   "nameBreakAfter": 1
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

// --- Globalis valtozok (suspendHistory string-eval) ---
var _doc, _data, _dpi, _moved = 0, _errors = 0;

// --- Nev tordeles (breakAfter) ---
// Rovid prefixek (dr., id., ifj. — max 2 betu pont nelkul) nem szamitanak szokent
// Photoshop \r-t hasznal sortoresnek
function _breakName(name, breakAfter) {
  if (breakAfter <= 0) return name;
  var words = name.split(" ");
  if (words.length < 2) return name;
  var realWordCount = 0;
  var breakIndex = -1;
  for (var i = 0; i < words.length; i++) {
    var cleaned = words[i].replace(/\./g, "");
    if (cleaned.length > 2) realWordCount++;
    if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
  }
  if (breakIndex === -1) return name;
  return words.slice(0, breakIndex).join(" ") + "\r" + words.slice(breakIndex).join(" ");
}

// --- Nev kiolvasasa a text layer-bol (sortoresek nelkul) ---
function _getPlainName(textItem) {
  var raw = textItem.contents;
  // \r es \n eltavolitasa — eredeti sima nev visszaallitasa
  return raw.replace(/[\r\n]/g, " ").replace(/  +/g, " ");
}

// --- cm → px konverzio (lokalis, kerekitett) ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Kep layer keresese nev alapjan (layerName egyezes) ---
function _findImageLayer(nameLayerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(_doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      if (grp.artLayers[i].name === nameLayerName) {
        return grp.artLayers[i];
      }
    }
  }
  return null;
}

// --- Layer bounds EFFEKTEKKEL (sima bounds — stroke-ot is tartalmazza) ---
function _getBoundsWithEffects(layer) {
  selectLayerById(layer.id);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);

  var b = desc.getObjectValue(stringIDToTypeID("bounds"));
  return {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
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

// --- Nev szovegenek frissitese + pozicionalasa a kep ala ---
// A gap a kep vizualis alja (stroke-kal!) es a szoveg vizualis teteje kozott ertendo.
// Eljarás:
//   1. Szoveg frissites (tordeles)
//   2. Baseline pozicionalas: imgBottom + gapPx (ez a szoveg TETEJE lesz kb.)
//   3. Bounding box top lekerdezes → korrekcios delta szamitas
//   4. Ujra pozicionalas a korrekciobol
function _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign, breakAfter) {
  // Kep bounds EFFEKTEKKEL (stroke szamit!)
  var imgBounds = _getBoundsWithEffects(imageLayer);
  var imgCenterX = (imgBounds.left + imgBounds.right) / 2;
  var imgBottom = imgBounds.bottom;

  // Nev layer kivalasztasa
  selectLayerById(nameLayer.id);
  _doc.activeLayer = nameLayer;

  // Text igazitas beallitasa + szoveg frissites
  var textItem;
  try {
    textItem = nameLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      textItem.justification = alignMap[textAlign];
    }

    // Szoveg frissites: eredeti nev kiolvasas (sortoresek nelkul) → ujra tordeles
    var plainName = _getPlainName(textItem);
    var newText = _breakName(plainName, breakAfter);
    if (textItem.contents !== newText) {
      textItem.contents = newText;
    }
  } catch (e) {
    // nem text layer — skip
    return;
  }

  // Vizszintes pozicio
  var targetX;
  if (textAlign === "left") {
    targetX = imgBounds.left;
  } else if (textAlign === "right") {
    targetX = imgBounds.right;
  } else {
    targetX = imgCenterX;
  }

  // --- Gap korrekció: a gap a kep alja es a szoveg VIZUALIS teteje kozott ---
  // 1. Elso pozicionalas: baseline = imgBottom + gapPx + fontSize (becsles)
  var fontSize = textItem.size.as("px");
  var initialBaselineY = imgBottom + gapPx + fontSize;
  textItem.position = [new UnitValue(Math.round(targetX), "px"), new UnitValue(Math.round(initialBaselineY), "px")];

  // 2. Bounding box top lekerdezes a tényleges pozícióból
  var textBounds = _getBoundsNoEffects(nameLayer);
  var actualTextTop = textBounds.top;

  // 3. A kivant textTop = imgBottom + gapPx
  var desiredTextTop = imgBottom + gapPx;

  // 4. Delta korrekció: mennyit kell tolni a baseline-on
  var deltaY = desiredTextTop - actualTextTop;
  var correctedBaselineY = initialBaselineY + deltaY;

  textItem.position = [new UnitValue(Math.round(targetX), "px"), new UnitValue(Math.round(correctedBaselineY), "px")];
}

// --- Egy csoport nev layereinek rendezese ---
function _arrangeNameGroup(nameGroupPath) {
  var grp = getGroupByPath(_doc, nameGroupPath);
  if (!grp || grp.artLayers.length === 0) return;

  var gapPx = _cm2px(_data.nameGapCm || 0.5);
  var textAlign = _data.textAlign || "center";
  var breakAfter = _data.nameBreakAfter || 0;

  log("[JSX] Csoport: " + nameGroupPath.join("/") + " (" + grp.artLayers.length + " layer, gap=" + gapPx + "px, align=" + textAlign + ", breakAfter=" + breakAfter + ")");

  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var nameLayer = grp.artLayers[i];

    try {
      var imageLayer = _findImageLayer(nameLayer.name);
      if (!imageLayer) {
        log("[JSX] WARN: Nincs par kep: " + nameLayer.name);
        _errors++;
        continue;
      }

      _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign, breakAfter);
      _moved++;
    } catch (e) {
      log("[JSX] WARN: Nev pozicionalas sikertelen (" + nameLayer.name + "): " + e.message);
      _errors++;
    }
  }
}

function _doArrangeNames() {
  // 1. Diak nevek
  _arrangeNameGroup(["Names", "Students"]);
  // 2. Tanar nevek
  _arrangeNameGroup(["Names", "Teachers"]);
}

(function () {
  try {
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum!");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data) {
      log("[JSX] Nincs adat — kilep.");
      return;
    }

    // DPI kiolvasas + ruler PIXELS-re
    _dpi = _doc.resolution;
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Nevek rendezese — egyetlen history lepes
    _doc.suspendHistory("Nevek rendezese", "_doArrangeNames()");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] KESZ: " + _moved + " nev mozgatva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

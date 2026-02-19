/**
 * arrange-names.jsx — Nev layerek pozicionalasa a kepek ala
 *
 * Minden nev layert a hozza tartozo kep ala pozicional,
 * a beallitott gap es text igazitas alapjan.
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "nameGapCm": 0.5,
 *   "textAlign": "center"
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

// --- cm → px konverzio (lokalis, kerekitett) ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Kep layer keresese nev alapjan (layerName egyezes) ---
// A Names es Images csoportok layerei azonos nevet kapjak (pl. kiss-janos---42)
function _findImageLayer(nameLayerName) {
  // Keresunk Students es Teachers csoportban is
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

// --- Nev pozicionalasa a kep ala ---
function _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign) {
  var imgBnfe = _getBoundsNoEffects(imageLayer);
  var imgCenterX = (imgBnfe.left + imgBnfe.right) / 2;
  var imgBottom = imgBnfe.bottom;

  // Nev layer kivalasztasa es bounds kiolvasas
  selectLayerById(nameLayer.id);
  _doc.activeLayer = nameLayer;

  // Text igazitas beallitasa
  try {
    var textItem = nameLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      textItem.justification = alignMap[textAlign];
    }
  } catch (e) {
    // nem text layer — skip
  }

  var nameBnfe = _getBoundsNoEffects(nameLayer);
  var nameW = nameBnfe.right - nameBnfe.left;

  // Celpozicio kiszamitasa
  var targetTop = imgBottom + gapPx;
  var targetLeft;

  if (textAlign === "left") {
    targetLeft = imgBnfe.left;
  } else if (textAlign === "right") {
    targetLeft = imgBnfe.right - nameW;
  } else {
    // center (default)
    targetLeft = imgCenterX - nameW / 2;
  }

  // Mozgatas
  var dx = targetLeft - nameBnfe.left;
  var dy = targetTop - nameBnfe.top;
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    nameLayer.translate(
      new UnitValue(Math.round(dx), "px"),
      new UnitValue(Math.round(dy), "px")
    );
  }
}

// --- Egy csoport nev layereinek rendezese ---
function _arrangeNameGroup(nameGroupPath) {
  var grp = getGroupByPath(_doc, nameGroupPath);
  if (!grp || grp.artLayers.length === 0) return;

  var gapPx = _cm2px(_data.nameGapCm || 0.5);
  var textAlign = _data.textAlign || "center";

  log("[JSX] Csoport: " + nameGroupPath.join("/") + " (" + grp.artLayers.length + " layer, gap=" + gapPx + "px, align=" + textAlign + ")");

  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var nameLayer = grp.artLayers[i];

    try {
      // Megkeressuk a parjat az Images csoportban (azonos layerName)
      var imageLayer = _findImageLayer(nameLayer.name);
      if (!imageLayer) {
        log("[JSX] WARN: Nincs par kep: " + nameLayer.name);
        _errors++;
        continue;
      }

      _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign);
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

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
// FONTOS: A textItem.position a szoveg "anchor point"-ja (baseline bal szele),
// NEM a bounding box! Igy az ekezetes nagybetuk (A, E) nem tolják feljebb a nevet.
// Minden nev baseline-ja egyforma Y-ra kerul, fuggetlenul az ekezetek magassagatol.
function _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign) {
  var imgBnfe = _getBoundsNoEffects(imageLayer);
  var imgCenterX = (imgBnfe.left + imgBnfe.right) / 2;
  var imgBottom = imgBnfe.bottom;

  // Nev layer kivalasztasa
  selectLayerById(nameLayer.id);
  _doc.activeLayer = nameLayer;

  // Text igazitas beallitasa
  var textItem;
  try {
    textItem = nameLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      textItem.justification = alignMap[textAlign];
    }
  } catch (e) {
    // nem text layer — skip
    return;
  }

  // A textItem.position a baseline anchor pontja (px-ben, UnitValue)
  // Ez STABIL referenciapont — az ekezet magassaga NEM befolyasolja!
  // Ha minden nev baseline-jat azonos Y-ra allitjuk, egyvonalba kerulnek,
  // fuggetlenul attol hogy van-e ekezetes nagybetu (A, E, O stb.) a nevben.

  // A gap a kep alja es a NAGYBETUS TETEJE kozott ertendo.
  // Referencia ascent: a font merete * ~1.2 (heurisztika a cap-height + ekezet szamara)
  // Igy a "latható szoveg teteje" kb. a gap-en lesz, es a baseline MINDENKINÉL azonos Y-on.
  var fontSize = textItem.size.as("px");
  var refAscentPx = Math.round(fontSize * 1.2);

  // Cel baseline Y: kep alja + gap + referencia ascent
  var targetBaselineY = imgBottom + gapPx + refAscentPx;

  // Vizszintes pozicio: a textItem.position.x a justification-tol fugg:
  //   LEFT: a szoveg bal szele
  //   CENTER: a szoveg kozepe
  //   RIGHT: a szoveg jobb szele
  var targetX;
  if (textAlign === "left") {
    targetX = imgBnfe.left;
  } else if (textAlign === "right") {
    targetX = imgBnfe.right;
  } else {
    // center: a kep kozepere
    targetX = imgCenterX;
  }

  // Mozgatas: position-t allitjuk (nem translate!), igy pontos baseline igazitas
  textItem.position = [new UnitValue(Math.round(targetX), "px"), new UnitValue(Math.round(targetBaselineY), "px")];
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

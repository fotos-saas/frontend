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

// --- Referencia: a baseline es a bounds.top kozotti tavolsag ---
// A textItem.position a baseline-t adja, a bounds.top a legfelso pixel.
// A kulonbseg (baselineOffset) font-fuggetlen es konstans adott font/merethez.
// Ezt EGYSZER merjuk, majd minden nevnel hasznaljuk:
//   desiredBoundsTop = imgBottom + gap
//   desiredBaseline = desiredBoundsTop + baselineOffset
//   textItem.position = [x, desiredBaseline]
var _baselineOffset = null;
var _baselineOffsetPos = null;

// --- Nev tordeles (breakAfter) ---
// Rovid prefix (Dr., Cs., Id., Ifj. — max 2 betu pont nelkul) a kovetkezo szohoz tartozik,
// NEM onallo nevresz. A "valodi" nevreszek szama dont: <3 → nem tor.
// Kotojeles szo utan torjuk ha 3+ valodi nevresz van.
// Photoshop \r-t hasznal sortoresnek
function _breakName(name, breakAfter) {
  if (breakAfter <= 0) return name;
  var words = name.split(" ");
  if (words.length < 2) return name;
  // Rovid prefix vizsgalat (max 2 betu pont nelkul)
  function isPrefix(w) { return w.replace(/\./g, "").length <= 2; }
  // Valodi nevreszek szamolasa
  var realCount = 0;
  for (var c = 0; c < words.length; c++) {
    if (!isPrefix(words[c])) realCount++;
  }
  // Kevesebb mint 3 valodi nevresz → nem tordelunk
  if (realCount < 3) return name;
  // Kotojeles nev: a kotojeles szo utan torjuk
  var hyphenIndex = -1;
  for (var h = 0; h < words.length; h++) {
    if (words[h].indexOf("-") !== -1) { hyphenIndex = h; break; }
  }
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(" ") + "\r" + words.slice(hyphenIndex + 1).join(" ");
  }
  // Normal nev: breakAfter valodi szo utan
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
  // \r es \n eltavolitasa — eredeti sima nev visszaallitasa
  return raw.replace(/[\r\n]/g, " ").replace(/  +/g, " ");
}

// --- cm → px konverzio (lokalis, kerekitett) ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Pozicio layer keresese nev alapjan (Positions/Students vagy Positions/Teachers) ---
function _findPositionLayer(layerName) {
  var groups = [["Positions", "Students"], ["Positions", "Teachers"]];
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

// --- Referencia meres: baseline offset (position.y - bounds.top) ---
// Letrehoz egy atmeneti "Hg" text layert ugyanazzal a fonttal/merettel,
// megmeri a position.y (baseline) es a bounds.top kozotti kulonbseget.
// Ez a tavolsag konstans adott font/merethez, fuggetlen a szoveg tartalmatol.
// Ezt hasznaljuk arra, hogy a bounds.top-ot fix helyre tegyuk (kep alja + gap),
// es ebbol kiszamitsuk a helyes baseline poziciot.
function _measureBaselineOffset(container, fontSize) {
  var useFontSize = fontSize || CONFIG.FONT_SIZE;
  var refLayer = _doc.artLayers.add();
  refLayer.kind = LayerKind.TEXT;
  refLayer.name = "__ref_measure__";
  var ti = refLayer.textItem;
  ti.contents = "Hg";
  ti.font = CONFIG.FONT_NAME;
  ti.size = new UnitValue(useFontSize, "pt");
  ti.justification = Justification.LEFT;
  refLayer.move(container, ElementPlacement.INSIDE);

  // position.y = baseline Y koordinata
  var posY = ti.position[1].as("px");
  // bounds.top = legfelso pixel Y koordinata
  var b = _getBoundsNoEffects(refLayer);

  var offset = posY - b.top; // baseline - boundsTop = pozitiv szam

  refLayer.remove();
  return offset;
}

// --- Nev szovegenek frissitese + pozicionalasa a kep ala ---
// A gap a kep alja (EFFEKTEK NELKUL — stroke nem szamit!) es a szoveg teteje kozott.
//
// POZICIONALASI STRATEGIA (textItem.position alapu):
// A textItem.position a szoveg BASELINE anchor pontja — ez NEM fugg a szoveg
// tartalmatol (ekezetek, magassag stb.), csak a font es meret határozza meg.
// A bounds.top viszont fugg a konkret karakterektol (A vs A vs g).
//
// Ezert a position-t hasznaljuk a vertikalis pozicionalasra:
//   1. Kiszamoljuk hova keruljon a bounds.top: imgBottom + gap
//   2. A baseline = bounds.top + _baselineOffset (egyszer mert konstans)
//   3. textItem.position = [x, baseline]
//
// A vizszintes poziciot a textItem.position.x es a justification egyutt kezeli:
//   - LEFT: position.x = kep bal szele
//   - CENTER: position.x = kep kozepe
//   - RIGHT: position.x = kep jobb szele
function _positionNameUnderImage(nameLayer, imageLayer, gapPx, textAlign, breakAfter) {
  // Kep bounds EFFEKTEK NELKUL — a gap a kep szelétől indul, NEM a stroke-tol
  var imgBounds = _getBoundsNoEffects(imageLayer);
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

  // --- Pozicionalas: textItem.position (baseline anchor) ---
  // A desiredBoundsTop az, ahova a szoveg felso szelet akarjuk:
  var desiredBoundsTop = imgBottom + gapPx;
  // A baseline ehhez kepest _baselineOffset-tel lejjebb van:
  var desiredBaselineY = desiredBoundsTop + _baselineOffset;

  // Vizszintes pozicio a justification alapjan:
  // A textItem.position.x a justification anchor pontja:
  //   LEFT → bal szeltol, CENTER → kozeptol, RIGHT → jobb szeltol
  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = imgCenterX;
  }

  // Position beallitasa — a baseline anchor pont
  textItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(desiredBaselineY), "px")];
}

// --- Pozicio (beosztás) layer pozicionalasa a nev ala ---
function _positionPositionLayerUnderName(posLayer, nameLayer, imageLayer, textAlign) {
  var nameBounds = _getBoundsNoEffects(nameLayer);
  var nameBottom = nameBounds.bottom;

  var posGapPx = _cm2px(CONFIG.POSITION_GAP_CM);

  // Baseline offset meres a kisebb fonthoz (egyszer)
  if (_baselineOffsetPos === null) {
    var container = getGroupByPath(_doc, ["Positions", "Students"]) || getGroupByPath(_doc, ["Positions", "Teachers"]) || _doc;
    _baselineOffsetPos = _measureBaselineOffset(container, CONFIG.POSITION_FONT_SIZE);
    log("[JSX] Position baseline offset (" + CONFIG.POSITION_FONT_SIZE + "pt): " + _baselineOffsetPos + "px");
  }

  var posBoundsTop = nameBottom + posGapPx;
  var posBaselineY = posBoundsTop + _baselineOffsetPos;

  // Vizszintes pozicio: a kep alapjan
  var imgBounds = _getBoundsNoEffects(imageLayer);
  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = (imgBounds.left + imgBounds.right) / 2;
  }

  // Justification + pozicio beallitas
  selectLayerById(posLayer.id);
  _doc.activeLayer = posLayer;
  try {
    var posTextItem = posLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      posTextItem.justification = alignMap[textAlign];
    }
    posTextItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(posBaselineY), "px")];
  } catch (e) {
    log("[JSX] WARN: Pozicio pozicionalas sikertelen (" + posLayer.name + "): " + e.message);
  }
}

// --- Egy csoport nev layereinek rendezese ---
function _arrangeNameGroup(nameGroupPath) {
  var grp = getGroupByPath(_doc, nameGroupPath);
  if (!grp || grp.artLayers.length === 0) return;

  var gapPx = _cm2px(_data.nameGapCm || 0.5);
  var textAlign = _data.textAlign || "center";
  var breakAfter = _data.nameBreakAfter || 0;

  // Baseline offset meres (egyszer, az elso csoportnal)
  // Ez a baseline es a bounds.top kozotti fix tavolsag adott font/merethez.
  // Ezzel tudjuk kiszamolni a helyes baseline poziciot a kivant bounds.top-bol.
  if (_baselineOffset === null) {
    _baselineOffset = _measureBaselineOffset(grp);
    log("[JSX] Baseline offset (Hg): " + _baselineOffset + "px");
  }

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

      // Pozicio (beosztás) layer mozgatasa a nev ala
      var posLayer = _findPositionLayer(nameLayer.name);
      if (posLayer) {
        _positionPositionLayerUnderName(posLayer, nameLayer, imageLayer, textAlign);
      }
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

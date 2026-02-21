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

// --- Nev szovegenek frissitese + pozicionalasa a kep ala ---
// A gap a kep alja (EFFEKTEK NELKUL — stroke nem szamit!) es a szoveg teteje kozott.
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

  // Vizszintes pozicio
  var targetX;
  if (textAlign === "left") {
    targetX = imgBounds.left;
  } else if (textAlign === "right") {
    targetX = imgBounds.right;
  } else {
    targetX = imgCenterX;
  }

  // --- Pozicionalas: translate a tenyleges bounds alapjan ---
  // A textItem.position nem mindig frissiti a bounds-ot azonnal,
  // ezert CSAK translate-et hasznalunk (az MINDIG frissit).
  // Elobb origora mozgatjuk, aztan celba.

  // 1. Origora mozgatas (bounds alapjan)
  var b1 = _getBoundsNoEffects(nameLayer);
  nameLayer.translate(new UnitValue(Math.round(-b1.left), "px"), new UnitValue(Math.round(-b1.top), "px"));

  // 2. Celba mozgatas
  var desiredTop = imgBottom + gapPx;
  var desiredLeft;
  if (textAlign === "left") {
    desiredLeft = imgBounds.left;
  } else if (textAlign === "right") {
    // Jobb igazitas: bounds jobb szele = kep jobb szele
    var b2 = _getBoundsNoEffects(nameLayer);
    var textW = b2.right - b2.left;
    desiredLeft = imgBounds.right - textW;
  } else {
    // Kozep igazitas: bounds kozepe = kep kozepe
    var b2c = _getBoundsNoEffects(nameLayer);
    var textW2 = b2c.right - b2c.left;
    desiredLeft = imgCenterX - textW2 / 2;
  }

  nameLayer.translate(new UnitValue(Math.round(desiredLeft), "px"), new UnitValue(Math.round(desiredTop), "px"));
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
  // Linkelesek leszedese — a translate linkelt tarsakat is mozgatna
  var savedLinks = saveLinkGroups(_doc, log);

  // 1. Diak nevek
  _arrangeNameGroup(["Names", "Students"]);
  // 2. Tanar nevek
  _arrangeNameGroup(["Names", "Teachers"]);

  // Linkelesek visszaallitasa
  restoreLinkGroups(_doc, savedLinks, log);
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

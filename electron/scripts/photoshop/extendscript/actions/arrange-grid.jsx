/**
 * arrange-grid.jsx — Tablokepes grid elrendezes
 *
 * A tablokepek (diak + tanar) racsba rendezese a megadott parameterek alapjan.
 * Minden csoport kulon grid-et kap: elobb a diakok, alattuk a tanarok.
 *
 * FONTOS: Minden szamitas PIXELBEN tortenik a kerekitesi hibak elkerulesehez!
 * A cm ertekeket a dokumentum DPI-jevel konvertaljuk px-re az elejen.
 *
 * JSON formatum (Electron handler kesziti):
 * {
 *   "boardWidthCm": 120,
 *   "boardHeightCm": 80,
 *   "marginCm": 2,
 *   "studentSizeCm": 6,
 *   "teacherSizeCm": 6,
 *   "gapHCm": 2,
 *   "gapVCm": 3
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
var _doc, _data, _dpi, _freeZone;

// --- cm → px konverzio (lokalis, kerekitett) ---
function _cm2px(cm) {
  return Math.round((cm / 2.54) * _dpi);
}

// --- Layer bounds EFFEKTEK NELKUL (boundsNoEffects) ---
// A layer.bounds tartalmazza a Layer Style effekteket (stroke, shadow, glow stb.)
// ami elrontja a grid szamitast. Az ActionManager-rel lekerdezzuk az
// effekt nelkuli meretet (boundsNoEffects), es ABBOL szamolunk.
// Visszaad: { left, top, right, bottom } pixelben
function _getBoundsNoEffects(layer) {
  selectLayerById(layer.id);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);

  // boundsNoEffects — effekt nelkuli bounds
  // Ha nincs ilyen (regi PS verzio), fallback a sima bounds-ra
  var boundsKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
  } else {
    // Fallback: sima bounds
    b = desc.getObjectValue(stringIDToTypeID("bounds"));
  }

  return {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
}

// --- Egy csoport layer-einek racsba rendezese (PIXELBEN) ---
// grp: LayerSet (pl. Images/Students)
// photoWPx, photoHPx: kep merete pixelben (effektek nelkul!)
// marginPx, gapHPx, gapVPx: margo es gap pixelben
// boardWPx: tablo szelessege pixelben
// startTopPx: a racs indulasi pontja fentrol pixelben
// maxPerRow: opcionalis — max elemszam soronkent (felulirja a fizikai korlat alaput)
// Visszaadja a kovetkezo csoport start poziciojat pixelben
function _arrangeGroupGridPx(grp, photoWPx, photoHPx, marginPx, gapHPx, gapVPx, boardWPx, startTopPx, maxPerRow) {
  if (!grp || grp.artLayers.length === 0) return startTopPx;

  var availableW = boardWPx - 2 * marginPx;

  // Hany kep fer egy sorba
  var columns = Math.floor((availableW + gapHPx) / (photoWPx + gapHPx));
  if (columns < 1) columns = 1;

  // maxPerRow feluliras ha van
  if (maxPerRow && maxPerRow > 0 && maxPerRow < columns) {
    columns = maxPerRow;
  }

  var layerCount = grp.artLayers.length;
  var rows = Math.ceil(layerCount / columns);
  log("[JSX] Grid: " + columns + " oszlop x " + rows + " sor, " + layerCount + " layer, gapH=" + gapHPx + "px, gapV=" + gapVPx + "px, kep=" + photoWPx + "x" + photoHPx + "px");

  var currentRow = 0;
  var currentCol = 0;
  var topPx = startTopPx;

  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var layer = grp.artLayers[i];

    try {
      // Aktualis sor elemszama (utolso sornal kevesebb lehet)
      var remainingItems = layerCount - (currentRow * columns);
      var itemsInThisRow = (remainingItems >= columns) ? columns : remainingItems;

      // Igazitas pixelben (left/center/right)
      var totalRowW = itemsInThisRow * photoWPx + (itemsInThisRow - 1) * gapHPx;
      var gridAlign = _data.gridAlign || "center";
      var offsetX;
      if (gridAlign === "left") {
        offsetX = marginPx;
      } else if (gridAlign === "right") {
        offsetX = marginPx + Math.round(availableW - totalRowW);
      } else {
        offsetX = marginPx + Math.round((availableW - totalRowW) / 2);
      }

      var leftPx = offsetX + currentCol * (photoWPx + gapHPx);

      // Layer kivalasztasa es pozicionalasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;

      // Origoba mozgatas — boundsNoEffects-bol szamolva!
      var bnfe = _getBoundsNoEffects(layer);
      var dx = -bnfe.left;
      var dy = -bnfe.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        layer.translate(new UnitValue(Math.round(dx), "px"), new UnitValue(Math.round(dy), "px"));
      }

      // Celpozicioba mozgatas
      layer.translate(new UnitValue(leftPx, "px"), new UnitValue(topPx, "px"));

      // Kovetkezo pozicio
      currentCol++;
      if (currentCol >= columns) {
        currentCol = 0;
        currentRow++;
        topPx += photoHPx + gapVPx;
      }
    } catch (e) {
      log("[JSX] WARN: Layer pozicionalas sikertelen (" + layer.name + "): " + e.message);
    }
  }

  // Kovetkezo csoport start pozicioja
  if (currentCol > 0) {
    // Utolso sor meg nem zarodott le
    return topPx + photoHPx + gapVPx;
  }
  return topPx;
}

// --- Csoport elso layer-jenek tenyleges merete pixelben (EFFEKTEK NELKUL) ---
// A resize utan a Photoshop kerekithet, ezert a tenyleges bounds-bol olvassuk
// ki a meretet. boundsNoEffects-t hasznalunk, igy stroke/shadow nem szamit!
function _getActualLayerSize(grp) {
  if (!grp || grp.artLayers.length === 0) return null;
  var layer = grp.artLayers[grp.artLayers.length - 1]; // elso (hatul van)
  var bnfe = _getBoundsNoEffects(layer);
  var w = Math.round(bnfe.right - bnfe.left);
  var h = Math.round(bnfe.bottom - bnfe.top);
  if (w <= 0 || h <= 0) return null;
  return { w: w, h: h };
}

// --- Sorok szamanak kiszamitasa egy csoporthoz ---
function _calcRows(grp, photoWPx, marginPx, gapHPx, boardWPx) {
  if (!grp || grp.artLayers.length === 0) return 0;
  var availableW = boardWPx - 2 * marginPx;
  var columns = Math.floor((availableW + gapHPx) / (photoWPx + gapHPx));
  if (columns < 1) columns = 1;
  return Math.ceil(grp.artLayers.length / columns);
}

function _doArrangeGrid() {
  // Margin, gap, board → cm-bol px-re (ezek nem layerek, nincs kerekitesi hiba)
  var marginPx = _cm2px(_data.marginCm || 0);
  var gapHPx = _cm2px(_data.gapHCm || 2);
  var gapVPx = _cm2px(_data.gapVCm || 3);
  var boardWPx = _cm2px(_data.boardWidthCm);
  var boardHPx = _cm2px(_data.boardHeightCm);

  // Fallback cm → px (ha nincs layer)
  var studentWPxFallback = _cm2px(_data.studentSizeCm);
  var studentHPxFallback = _cm2px(_data.studentSizeCm * 1.5);
  var teacherWPxFallback = _cm2px(_data.teacherSizeCm);
  var teacherHPxFallback = _cm2px(_data.teacherSizeCm * 1.5);

  log("[JSX] === GRID v6 TABLO_LAYOUT ===");
  log("[JSX] DPI=" + _dpi + ", board=" + boardWPx + "x" + boardHPx + "px, margin=" + marginPx + "px, gapH=" + gapHPx + "px, gapV=" + gapVPx + "px");
  log("[JSX] tabloLayout=" + (_data.tabloLayout ? "true" : "false"));

  var studentsGroup = getGroupByPath(_doc, ["Images", "Students"]);
  var teachersGroup = getGroupByPath(_doc, ["Images", "Teachers"]);

  // Tenyleges kepmeretek kiolvasasa
  var studentActual = studentsGroup ? _getActualLayerSize(studentsGroup) : null;
  var sW = studentActual ? studentActual.w : studentWPxFallback;
  var sH = studentActual ? studentActual.h : studentHPxFallback;

  var teacherActual = teachersGroup ? _getActualLayerSize(teachersGroup) : null;
  var tW = teacherActual ? teacherActual.w : teacherWPxFallback;
  var tH = teacherActual ? teacherActual.h : teacherHPxFallback;

  // --- Tablo layout mod: tanarok fent, diakok lent ---
  if (_data.tabloLayout) {
    var teacherEndY = marginPx;
    var studentStartY = marginPx;

    var teacherMaxPerRow = _data.teacherMaxPerRow || 0;
    var studentMaxPerRow = _data.studentMaxPerRow || 0;

    // 1. Tanarok FENTROL (startY = marginPx)
    if (teachersGroup && teachersGroup.artLayers.length > 0) {
      log("[JSX] Tanar csoport (FENT): " + teachersGroup.artLayers.length + " layer, meret: " + tW + "x" + tH + "px" + (teacherActual ? " (bounds)" : " (fallback)"));
      teacherEndY = _arrangeGroupGridPx(teachersGroup, tW, tH, marginPx, gapHPx, gapVPx, boardWPx, marginPx, teacherMaxPerRow);
    } else {
      log("[JSX] Tanar csoport ures vagy nem talalhato");
    }

    // 2. Diakok ALULROL (startY szamitas: alulrol felfelve)
    if (studentsGroup && studentsGroup.artLayers.length > 0) {
      var sRows = _calcRows(studentsGroup, sW, marginPx, gapHPx, boardWPx);
      // maxPerRow korlatozas ha van
      if (studentMaxPerRow > 0) {
        var sCols = Math.floor((boardWPx - 2 * marginPx + gapHPx) / (sW + gapHPx));
        if (sCols < 1) sCols = 1;
        if (studentMaxPerRow < sCols) sCols = studentMaxPerRow;
        sRows = Math.ceil(studentsGroup.artLayers.length / sCols);
      }
      var studentGridH = sRows * sH + (sRows - 1) * gapVPx;
      studentStartY = boardHPx - marginPx - gapVPx - studentGridH;
      log("[JSX] Diak csoport (LENT): " + studentsGroup.artLayers.length + " layer, meret: " + sW + "x" + sH + "px, " + sRows + " sor, startY=" + studentStartY + "px" + (studentActual ? " (bounds)" : " (fallback)"));
      _arrangeGroupGridPx(studentsGroup, sW, sH, marginPx, gapHPx, gapVPx, boardWPx, studentStartY, studentMaxPerRow);
    } else {
      log("[JSX] Diak csoport ures vagy nem talalhato");
      studentStartY = boardHPx - marginPx;
    }

    // 3. Szabad zona kiszamitasa es tarolasa
    _freeZone = { top: teacherEndY, bottom: studentStartY };
    log("[JSX] Szabad zona: top=" + _freeZone.top + "px, bottom=" + _freeZone.bottom + "px (" + (_freeZone.bottom - _freeZone.top) + "px)");
    return;
  }

  // --- Normál mód (backward compat): diakok fent, tanarok lent ---
  var startTopPx = marginPx;

  // 1. Diak csoport
  if (studentsGroup && studentsGroup.artLayers.length > 0) {
    log("[JSX] Diak csoport: " + studentsGroup.artLayers.length + " layer, tenyleges meret: " + sW + "x" + sH + "px" + (studentActual ? " (bounds)" : " (fallback)"));
    startTopPx = _arrangeGroupGridPx(studentsGroup, sW, sH, marginPx, gapHPx, gapVPx, boardWPx, startTopPx);
  } else {
    log("[JSX] Diak csoport ures vagy nem talalhato");
  }

  // 2. Tanar csoport (a diakok alatt)
  if (teachersGroup && teachersGroup.artLayers.length > 0) {
    log("[JSX] Tanar csoport: " + teachersGroup.artLayers.length + " layer, tenyleges meret: " + tW + "x" + tH + "px" + (teacherActual ? " (bounds)" : " (fallback)"));
    _arrangeGroupGridPx(teachersGroup, tW, tH, marginPx, gapHPx, gapVPx, boardWPx, startTopPx);
  } else {
    log("[JSX] Tanar csoport ures vagy nem talalhato");
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

    if (!_data || typeof _data.boardWidthCm === "undefined") {
      log("[JSX] Nincs grid adat — kilep.");
      return;
    }

    // DPI kiolvasas + ruler PIXELS-re (minden szamitas pixelben!)
    _dpi = _doc.resolution;
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Grid elrendezes — egyetlen history lepes
    _doc.suspendHistory("Tablo grid elrendezes", "_doArrangeGrid()");

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] KESZ");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

// tabloLayout modban JSON stringet adunk vissza a freeZone ertekekkel
// FONTOS: ExtendScript ES3 — NINCS JSON.stringify! Kezzel epitjuk a stringet.
var _result;
if (_data && _data.tabloLayout && _freeZone) {
  _result = '{"success":true,"freeZoneTopPx":' + _freeZone.top + ',"freeZoneBottomPx":' + _freeZone.bottom + '}';
} else {
  _result = _logLines.join("\n");
}
_result;

/**
 * arrange-grid.jsx — Tablokepes grid elrendezes
 *
 * A tablokepek (diak + tanar) racsba rendezese a megadott parameterek alapjan.
 * Minden csoport kulon grid-et kap: elobb a diakok, alattuk a tanarok.
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
 * Algoritmus:
 *   1. photoWidth = sizeCm, photoHeight = sizeCm * 1.5 (10:15 arany)
 *   2. availableWidth = boardWidthCm - 2 * marginCm
 *   3. columns = floor((availableWidth + gapHCm) / (photoWidth + gapHCm))
 *   4. Soronkent kozepre igazitas
 *   5. Diakok felulrol, tanarok a diakok alatt (gapVCm tavolsag)
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
var _doc, _data, _dpi;

// --- Egy csoport layer-einek racsba rendezese ---
// grp: LayerSet (pl. Images/Students)
// sizeCm: a kep szelessege cm-ben
// startTopCm: a racs indulasi pontja fentrol cm-ben
// Visszaadja az utolso sor alja + gapCm erteket (kovetkezo csoport startja)
function _arrangeGroupGrid(grp, sizeCm, startTopCm) {
  if (!grp || grp.artLayers.length === 0) return startTopCm;

  var photoWidth = sizeCm;
  var photoHeight = sizeCm * 1.5; // 10:15 arany
  var marginCm = _data.marginCm || 0;
  var gapH = _data.gapHCm || 2;  // vizszintes gap (kepek kozott egy sorban)
  var gapV = _data.gapVCm || 3;  // fuggoleges gap (sorok kozott)
  var boardWidthCm = _data.boardWidthCm;

  var availableWidth = boardWidthCm - 2 * marginCm;

  // Hany kep fer egy sorba
  var columns = Math.floor((availableWidth + gapH) / (photoWidth + gapH));
  if (columns < 1) columns = 1;

  var layerCount = grp.artLayers.length;
  var rows = Math.ceil(layerCount / columns);

  log("[JSX] Grid: " + columns + " oszlop x " + rows + " sor, " + layerCount + " layer, gapH=" + gapH + " cm, gapV=" + gapV + " cm, kepmeret=" + sizeCm + " cm");

  // Layer-ek vegigjarasa (hatulrol elore = felulrol lefele a Layers panelen)
  var currentRow = 0;
  var currentCol = 0;
  var top = startTopCm;

  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var layer = grp.artLayers[i];

    try {
      // Aktualis sor elemszama (utolso sor rovidebb lehet)
      var itemsInThisRow;
      var remainingItems = layerCount - (currentRow * columns);
      if (remainingItems >= columns) {
        itemsInThisRow = columns;
      } else {
        itemsInThisRow = remainingItems;
      }

      // Kozepre igazitas: az aktualis sor teljes szelessege
      var totalRowWidth = itemsInThisRow * photoWidth + (itemsInThisRow - 1) * gapH;
      var offsetX = marginCm + (availableWidth - totalRowWidth) / 2;

      // Celpozicio kiszamitasa
      var leftCm = offsetX + currentCol * (photoWidth + gapH);
      var topCm = top;

      // Layer kivalasztasa es pozicionalasa
      selectLayerById(layer.id);
      _doc.activeLayer = layer;
      resetLayerPosition(layer);
      positionLayerCm(layer, leftCm, topCm, _dpi);

      // Kovetkezo pozicio
      currentCol++;
      if (currentCol >= columns) {
        currentCol = 0;
        currentRow++;
        top += photoHeight + gapV;
      }
    } catch (e) {
      log("[JSX] WARN: Layer pozicionalas sikertelen (" + layer.name + "): " + e.message);
    }
  }

  // Visszaadjuk a kovetkezo csoport start poziciojat
  // (az utolso sor alja + fuggoleges gap)
  var lastRowTop = startTopCm + currentRow * (photoHeight + gapV);
  // Ha nem volt tobb sor (currentCol > 0 jelzi, hogy az utolso sor meg nem telt be)
  if (currentCol > 0) {
    // Az utolso sor meg nem zarodott le, szoval a top erteke meg nem novekedett
    lastRowTop = top + photoHeight + gapV;
  }

  return lastRowTop;
}

function _doArrangeGrid() {
  var marginCm = _data.marginCm || 0;
  var startTop = marginCm;

  // 1. Diak csoport
  var studentsGroup = getGroupByPath(_doc, ["Images", "Students"]);
  if (studentsGroup && studentsGroup.artLayers.length > 0) {
    log("[JSX] Diak csoport: " + studentsGroup.artLayers.length + " layer");
    startTop = _arrangeGroupGrid(studentsGroup, _data.studentSizeCm, startTop);
  } else {
    log("[JSX] Diak csoport ures vagy nem talalhato");
  }

  // 2. Tanar csoport (a diakok alatt)
  var teachersGroup = getGroupByPath(_doc, ["Images", "Teachers"]);
  if (teachersGroup && teachersGroup.artLayers.length > 0) {
    log("[JSX] Tanar csoport: " + teachersGroup.artLayers.length + " layer");
    _arrangeGroupGrid(teachersGroup, _data.teacherSizeCm, startTop);
  } else {
    log("[JSX] Tanar csoport ures vagy nem talalhato");
  }
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

    if (!_data || typeof _data.boardWidthCm === "undefined") {
      log("[JSX] Nincs grid adat — kilep.");
      return;
    }

    // DPI kiolvasas + ruler egyseg pixelre allitasa (pontos pozicionalas)
    _dpi = _doc.resolution; // px/inch
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

_logLines.join("\n");

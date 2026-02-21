/**
 * add-group-layers.jsx — Csoport + SO duplicate layerek hozzaadasa
 *
 * Forraskepekbol Smart Object-eket keszit, majd azokbol duplicate-ot
 * minden szemely poziciojara. Az SO duplicate megosztja a forraskepet
 * → kisebb PSD fajlmeret, gyorsabb muvelet.
 *
 * JSON formatum:
 * {
 *   "groupName": "Csoportkep",
 *   "sourceFiles": [
 *     { "filePath": "/path/to/csoportkep1.jpg" }
 *   ],
 *   "layers": [
 *     { "layerName": "kiss-janos---42", "group": "Students", "x": 500, "y": 200, "sourceIndex": 0 }
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

// --- Globalis valtozok (suspendHistory lathato scope) ---
var _doc, _data, _created = 0, _errors = 0;

function _doAddGroupLayers() {
  // --- 1. Top-level csoport letrehozasa ---
  var topGroup = _doc.layerSets.add();
  topGroup.name = _data.groupName;
  log("[JSX] Fo csoport letrehozva: " + _data.groupName);

  // --- 2. Alcsoportok letrehozasa ---
  var teachersGroup = topGroup.layerSets.add();
  teachersGroup.name = "Teachers";
  var studentsGroup = topGroup.layerSets.add();
  studentsGroup.name = "Students";
  log("[JSX] Alcsoportok: Teachers + Students");

  // --- 3. Forras SO-k letrehozasa (Place Embedded) ---
  var sourceLayers = [];
  for (var i = 0; i < _data.sourceFiles.length; i++) {
    var sf = _data.sourceFiles[i];
    try {
      // Place Embedded a dokumentumba
      var descPlace = new ActionDescriptor();
      descPlace.putPath(charIDToTypeID("null"), new File(sf.filePath));
      descPlace.putEnumerated(
        charIDToTypeID("FTcs"),
        charIDToTypeID("QCSt"),
        charIDToTypeID("Qcsa") // Fit
      );
      descPlace.putUnitDouble(charIDToTypeID("Ofst"), charIDToTypeID("#Pxl"), 0);
      descPlace.putUnitDouble(charIDToTypeID("OfsY"), charIDToTypeID("#Pxl"), 0);
      executeAction(stringIDToTypeID("placeEvent"), descPlace, DialogModes.NO);

      // A behelyezett layer az activeLayer
      var placedLayer = _doc.activeLayer;

      // Nev beallitasa (fajlnev)
      var fileName = sf.filePath;
      var lastSlash = fileName.lastIndexOf("/");
      if (lastSlash < 0) lastSlash = fileName.lastIndexOf("\\");
      if (lastSlash >= 0) fileName = fileName.substring(lastSlash + 1);
      placedLayer.name = "source-" + i + "-" + fileName;

      // Atrakasa a fo csoportba (gyoker szintre)
      placedLayer.move(topGroup, ElementPlacement.INSIDE);

      sourceLayers.push(placedLayer);
      log("[JSX] Forras SO letrehozva: " + placedLayer.name);
    } catch (e) {
      log("[JSX] HIBA forras SO (" + sf.filePath + "): " + e.message);
      sourceLayers.push(null);
      _errors++;
    }
  }

  // --- 4. SO duplicate minden szemely poziciojara ---
  for (var j = 0; j < _data.layers.length; j++) {
    var item = _data.layers[j];
    try {
      var srcIdx = item.sourceIndex;
      if (srcIdx < 0 || srcIdx >= sourceLayers.length || !sourceLayers[srcIdx]) {
        log("[JSX] HIBA: ervenytelen sourceIndex (" + srcIdx + ") layerhez: " + item.layerName);
        _errors++;
        continue;
      }

      var sourceLayer = sourceLayers[srcIdx];

      // Cel alcsoport
      var targetSubGroup = item.group === "Teachers" ? teachersGroup : studentsGroup;

      // SO duplicate
      var dupLayer = sourceLayer.duplicate();
      dupLayer.name = item.layerName;

      // Atrakasa a cel alcsoportba
      dupLayer.move(targetSubGroup, ElementPlacement.INSIDE);

      // Pozicionalas: elobb nullazas, utana translate
      resetLayerPosition(dupLayer);
      dupLayer.translate(
        new UnitValue(Math.round(item.x), "px"),
        new UnitValue(Math.round(item.y), "px")
      );

      _created++;
    } catch (e) {
      log("[JSX] HIBA duplicate (" + item.layerName + "): " + e.message);
      _errors++;
    }
  }

  // --- 5. Forras SO-k lathatosag kikapcsolasa (opcionalis, de attekinthetobb) ---
  for (var k = 0; k < sourceLayers.length; k++) {
    if (sourceLayers[k]) {
      try {
        sourceLayers[k].visible = false;
      } catch (e) { /* ignore */ }
    }
  }
}

(function () {
  try {
    // --- 1. Cel dokumentum aktivalasa ---
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    // --- 2. JSON beolvasas ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || !_data.sourceFiles || _data.sourceFiles.length === 0) {
      log("[JSX] Nincs forrasfajl — kilep.");
      return;
    }

    if (!_data.layers || _data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      return;
    }

    log("[JSX] Csoport: " + _data.groupName + " | Forrasok: " + _data.sourceFiles.length + " | Layerek: " + _data.layers.length);

    // --- 3. Vegrehajtás — egyetlen history lepes ---
    _doc.suspendHistory("Csoport layerek hozzaadasa: " + _data.groupName, "_doAddGroupLayers()");

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + _created + " layer letrehozva, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _created + " layer, " + (_errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

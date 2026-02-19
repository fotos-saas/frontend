/**
 * add-image-layers.jsx — Smart Object placeholder layerek hozzaadasa a megnyitott PSD-hez
 *
 * Az Electron handler kesziti elo a JSON-t (meretek, elnevezesek, csoportok).
 * Ez a script CSAK a Photoshop DOM-ot manipulalja — Smart Object layer letrehozas.
 *
 * JSON formatum (elokeszitett):
 * {
 *   "layers": [
 *     { "layerName": "kiss-janos---42", "group": "Students", "widthPx": 1228, "heightPx": 1819, "photoPath": null },
 *     { "layerName": "szabo-anna---101", "group": "Teachers", "widthPx": 1228, "heightPx": 1819, "photoPath": "/tmp/psd-photos/szabo-anna---101.jpg" }
 *   ],
 *   "stats": { "students": 25, "teachers": 3, "total": 28, "withPhoto": 3 },
 *   "imageSizeCm": { "widthCm": 10.4, "heightCm": 15.4, "dpi": 300 }
 * }
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer (writeln() nem elerheto do javascript modban) ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Globalis valtozok (suspendHistory string-eval nem lat IIFE scope-ot) ---
var _doc, _data, _created = 0, _photosPlaced = 0, _errors = 0;

function _doAddImageLayers() {
  // Kulonallo meretezesi ertekek diaknak es tanarnak
  var studentSizeCm = _data.studentSizeCm || 0;
  var teacherSizeCm = _data.teacherSizeCm || 0;
  var dpi = _doc.resolution; // dokumentum DPI

  log("[JSX] Meretezes parameterek: studentSizeCm=" + studentSizeCm + " teacherSizeCm=" + teacherSizeCm + " docDPI=" + dpi);

  for (var i = 0; i < _data.layers.length; i++) {
    var item = _data.layers[i];

    try {
      // Cel csoport keresese: Images/{group}
      var targetGroup = getGroupByPath(_doc, ["Images", item.group]);
      if (!targetGroup) {
        log("[JSX] HIBA: Images/" + item.group + " csoport nem talalhato!");
        _errors++;
        continue;
      }

      // Smart Object placeholder letrehozasa
      createSmartObjectPlaceholder(_doc, targetGroup, {
        name: item.layerName,
        widthPx: item.widthPx,
        heightPx: item.heightPx
      });
      _created++;

      // Megjegyezzuk az SO layer nevet a resize-hoz
      var soLayerName = _doc.activeLayer.name;

      // Foto behelyezese ha van photoPath
      // Flow: SO megnyitas → kep Place → cover meretezes → mentes → bezaras
      if (item.photoPath) {
        try {
          placePhotoInSmartObject(_doc, _doc.activeLayer, item.photoPath);
          _photosPlaced++;
          // Az SO bezarasa utan visszaterunk a cel dokumentumra (nev alapjan)
          _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
        } catch (photoErr) {
          log("[JSX] FIGYELEM: foto behelyezes sikertelen (" + item.layerName + "): " + photoErr.message);
          // Ha az SO megnyitva maradt, probaljuk bezarni
          try {
            if (app.documents.length > 1) {
              app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            }
          } catch (closeErr) { /* ignore */ }
          _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
        }
      }

      // Layer atmeretezese a diak/tanar meretre (ha be van allitva)
      // A SO belso merete valtozatlan marad, csak a layer transform valtozik
      var targetSizeCm = (item.group === "Teachers") ? teacherSizeCm : studentSizeCm;
      if (targetSizeCm > 0) {
        try {
          // Biztositjuk hogy a megfelelo SO layer legyen aktiv
          // (foto behelyezes utan az activeLayer elcsuszhat)
          var soLayer = _doc.activeLayer;
          if (soLayer.name !== soLayerName) {
            log("[JSX] FIGYELMEZTETES: activeLayer (" + soLayer.name + ") nem egyezik az SO-val (" + soLayerName + "), keresem...");
            // Keressuk meg a layert nev alapjan a csoportban
            try {
              soLayer = targetGroup.artLayers.getByName(soLayerName);
              _doc.activeLayer = soLayer;
            } catch (findErr) {
              log("[JSX] HIBA: SO layer nem talalhato nev alapjan: " + soLayerName);
            }
          }

          var bounds = soLayer.bounds;
          var currentHeightPx = bounds[3].as("px") - bounds[1].as("px");

          // Celmerete pixelben: (cm / 2.54) * docDpi
          var targetHeightPx = Math.round((targetSizeCm / 2.54) * dpi);

          log("[JSX] Resize " + soLayerName + ": currentH=" + currentHeightPx + "px targetH=" + targetHeightPx + "px targetCm=" + targetSizeCm + " group=" + item.group);

          if (currentHeightPx > 0 && Math.abs(currentHeightPx - targetHeightPx) > 1) {
            var scalePercent = (targetHeightPx / currentHeightPx) * 100;
            log("[JSX] Resize alkalmazas: " + scalePercent.toFixed(1) + "%");
            soLayer.resize(scalePercent, scalePercent, AnchorPosition.MIDDLECENTER);
            // Ellenorzes: resize utan a bounds ujra
            var newBounds = soLayer.bounds;
            var newH = newBounds[3].as("px") - newBounds[1].as("px");
            log("[JSX] Resize utani meret: " + newH + "px (elvart: " + targetHeightPx + "px)");
          } else {
            log("[JSX] Resize kihagyva: mar megfelelo meret (diff=" + Math.abs(currentHeightPx - targetHeightPx) + "px)");
          }
        } catch (resizeErr) {
          log("[JSX] FIGYELEM: layer atmeretezes sikertelen (" + item.layerName + "): " + resizeErr.message);
        }
      } else {
        log("[JSX] Resize kihagyva: targetSizeCm=" + targetSizeCm + " (0 vagy negativ)");
      }
    } catch (e) {
      log("[JSX] HIBA image layer (" + item.layerName + "): " + e.message);
      _errors++;
    }
  }
}

(function () {
  try {
    // --- 1. Cel dokumentum aktivalasa (nev alapjan, ha meg van adva) ---
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum! Elobb nyisd meg a PSD-t.");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    // --- 2. JSON beolvasas (elokeszitett adat az Electron handlertol) ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || !_data.layers || _data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      log("[JSX] KESZ: 0 layer, 0 foto, 0 hiba");
      return;
    }

    var withPhotoCount = _data.stats.withPhoto || 0;
    log("[JSX] Image layerek szama: " + _data.layers.length + " (diak: " + _data.stats.students + ", tanar: " + _data.stats.teachers + ", fotoval: " + withPhotoCount + ")");
    log("[JSX] Kepmeret: " + _data.imageSizeCm.widthCm + " x " + _data.imageSizeCm.heightCm + " cm @ " + _data.imageSizeCm.dpi + " DPI");
    log("[JSX] JSON studentSizeCm=" + _data.studentSizeCm + " teacherSizeCm=" + _data.teacherSizeCm);

    // --- 3. Smart Object layerek letrehozasa + foto behelyezes — egyetlen history lepes ---
    _doc.suspendHistory("Kep layerek hozzaadasa", "_doAddImageLayers()");

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + _created + " image layer letrehozva, " + _photosPlaced + " foto behelyezve, " + _errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + _created + " layer, " + _photosPlaced + " foto, " + (_errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

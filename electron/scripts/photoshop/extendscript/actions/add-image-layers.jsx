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

(function () {
  var created = 0;
  var photosPlaced = 0;
  var errors = 0;

  try {
    // --- 1. Aktiv dokumentum ellenorzes ---
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum! Elobb nyisd meg a PSD-t.");
    }
    var doc = app.activeDocument;
    log("[JSX] Dokumentum: " + doc.name + " (" + doc.width + " x " + doc.height + ")");

    // --- 2. JSON beolvasas (elokeszitett adat az Electron handlertol) ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    var data = readJsonFile(args.dataFilePath);

    if (!data || !data.layers || data.layers.length === 0) {
      log("[JSX] Nincs layer adat — kilep.");
      log("[JSX] KESZ: 0 layer, 0 foto, 0 hiba");
      return;
    }

    var withPhotoCount = data.stats.withPhoto || 0;
    log("[JSX] Image layerek szama: " + data.layers.length + " (diak: " + data.stats.students + ", tanar: " + data.stats.teachers + ", fotoval: " + withPhotoCount + ")");
    log("[JSX] Kepmeret: " + data.imageSizeCm.widthCm + " x " + data.imageSizeCm.heightCm + " cm @ " + data.imageSizeCm.dpi + " DPI");

    // --- 3. Smart Object layerek letrehozasa + foto behelyezes ---
    for (var i = 0; i < data.layers.length; i++) {
      var item = data.layers[i];

      try {
        // Cel csoport keresese: Images/{group}
        var targetGroup = getGroupByPath(doc, ["Images", item.group]);
        if (!targetGroup) {
          log("[JSX] HIBA: Images/" + item.group + " csoport nem talalhato!");
          errors++;
          continue;
        }

        // Smart Object placeholder letrehozasa
        createSmartObjectPlaceholder(doc, targetGroup, {
          name: item.layerName,
          widthPx: item.widthPx,
          heightPx: item.heightPx
        });
        created++;

        // Foto behelyezese ha van photoPath
        // Flow: SO megnyitas → kep Place → cover meretezes → mentes → bezaras
        if (item.photoPath) {
          try {
            placePhotoInSmartObject(doc, doc.activeLayer, item.photoPath);
            photosPlaced++;
            // A placePhotoInSmartObject bezarja az SO-t, tehat a fo doc ujra aktiv
            doc = app.activeDocument; // biztonsagi ujraolvasas
          } catch (photoErr) {
            log("[JSX] FIGYELEM: foto behelyezes sikertelen (" + item.layerName + "): " + photoErr.message);
            // Ha az SO megnyitva maradt, probaljuk bezarni
            try {
              if (app.documents.length > 1) {
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
              }
            } catch (closeErr) { /* ignore */ }
            doc = app.activeDocument;
          }
        }
      } catch (e) {
        log("[JSX] HIBA image layer (" + item.layerName + "): " + e.message);
        errors++;
      }
    }

    // --- 4. Eredmeny ---
    log("[JSX] KESZ: " + created + " image layer letrehozva, " + photosPlaced + " foto behelyezve, " + errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + created + " layer, " + photosPlaced + " foto, " + (errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

/**
 * flatten-export.jsx — Megnyitott PSD flatten es JPEG export temp mappaba
 *
 * Bemenet (CONFIG.DATA_FILE_PATH JSON):
 * {
 *   "outputPath": "/tmp/sample-export-1234.jpg",
 *   "quality": 90
 * }
 *
 * Mukodes:
 * 1. Aktiv dokumentum duplikatalasa (az eredetit NE bantsa!)
 * 2. Duplikatum flatten
 * 3. SaveAs JPEG (quality parameter)
 * 4. Duplikatum bezarasa (save nelkul)
 *
 * Visszateres: "OK" vagy hibauzenet
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc;

function _doFlattenExport() {
  var args = parseArgs();
  if (!args.dataFilePath) {
    throw new Error("Nincs megadva DATA_FILE_PATH!");
  }
  var data = readJsonFile(args.dataFilePath);

  if (!data || !data.outputPath) {
    throw new Error("Nincs megadva outputPath a JSON-ban!");
  }

  var outputPath = data.outputPath;
  var quality = data.quality || 90;

  log("[JSX] Flatten export indul: " + outputPath);

  // 1. Aktiv dokumentum duplikatalasa
  var dupDoc = _doc.duplicate("_flatten_temp_", false);
  app.activeDocument = dupDoc;

  log("[JSX] Duplikatum letrehozva: " + dupDoc.name);

  // 2. Flatten
  dupDoc.flatten();
  log("[JSX] Flatten kesz");

  // 3. Szinprofil konvertalas sRGB-re (webes hasznalatra)
  try {
    dupDoc.convertProfile("sRGB IEC61966-2.1", Intent.RELATIVECOLORIMETRIC, true, true);
    log("[JSX] sRGB konverzio kesz");
  } catch (e) {
    log("[JSX] sRGB konverzio kihagyva: " + e.message);
  }

  // 4. SaveAs JPEG
  var jpegOptions = new JPEGSaveOptions();
  jpegOptions.quality = quality;
  jpegOptions.formatOptions = FormatOptions.PROGRESSIVE;
  jpegOptions.scans = 3;
  jpegOptions.embedColorProfile = true;

  var outputFile = new File(outputPath);
  dupDoc.saveAs(outputFile, jpegOptions, true, Extension.LOWERCASE);
  log("[JSX] JPEG mentve: " + outputPath);

  // 5. Duplikatum bezarasa (save nelkul)
  dupDoc.close(SaveOptions.DONOTSAVECHANGES);
  log("[JSX] Duplikatum bezarva");

  log("__FLATTEN_RESULT__OK");
}

(function () {
  try {
    _doc = app.activeDocument;
    if (!_doc) {
      throw new Error("Nincs megnyitott dokumentum!");
    }

    // NE hasznaljunk suspendHistory-t: saveAs + close nem kompatibilis vele,
    // es amugy is duplikalt doc-on dolgozunk, az eredeti undo history-jat nem erintjuk.
    _doFlattenExport();
    log("[JSX] Flatten export kesz");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

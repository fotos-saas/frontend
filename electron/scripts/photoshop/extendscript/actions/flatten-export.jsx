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
  var _origDlg = app.displayDialogs;
  app.displayDialogs = DialogModes.NO;
  var dupDoc = null;

  try {
    var args = parseArgs();
    var quality = 90;
    var outputPath = null;

    // JSON parameterek olvasasa (opcionalis — ha nincs, auto temp path)
    if (args.dataFilePath) {
      try {
        var data = readJsonFile(args.dataFilePath);
        if (data.quality) quality = data.quality;
        if (data.outputPath) outputPath = data.outputPath;
      } catch (e) {
        log("[JSX] JSON olvasas kihagyva: " + e.message);
      }
    }

    // Ha nincs explicit outputPath, Photoshop temp mappajat hasznaljuk
    if (!outputPath) {
      outputPath = Folder.temp.fsName + "/photostack-flatten-" + new Date().getTime() + ".jpg";
    }

    log("[JSX] Flatten export indul: " + outputPath);

    // 1. Aktiv dokumentum duplikatalasa — ActionManager-rel (garantaltan dialog-mentes)
    var dupDesc = new ActionDescriptor();
    var dupRef = new ActionReference();
    dupRef.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Frst"));
    dupDesc.putReference(charIDToTypeID("null"), dupRef);
    dupDesc.putString(charIDToTypeID("Nm  "), "_flatten_temp_");
    dupDesc.putBoolean(stringIDToTypeID("duplicate"), true);
    executeAction(charIDToTypeID("Dplc"), dupDesc, DialogModes.NO);
    dupDoc = app.activeDocument;
    log("[JSX] Duplikatum letrehozva: " + dupDoc.name);

    // 2. Flatten
    dupDoc.flatten();
    log("[JSX] Flatten kesz");

    // 3. SaveAs JPEG (quality: Photoshop 0-12 skala, nem 0-100!)
    var jpegOptions = new JPEGSaveOptions();
    jpegOptions.quality = (quality > 12) ? Math.round(quality * 12 / 100) : quality;
    jpegOptions.formatOptions = FormatOptions.PROGRESSIVE;
    jpegOptions.scans = 3;
    jpegOptions.embedColorProfile = true;

    var outputFile = new File(outputPath);
    dupDoc.saveAs(outputFile, jpegOptions, true, Extension.LOWERCASE);
    log("[JSX] JPEG mentve: " + outputPath);

    // 4. Duplikatum bezarasa
    dupDoc.close(SaveOptions.DONOTSAVECHANGES);
    dupDoc = null;
    log("[JSX] Duplikatum bezarva");

    log("__FLATTEN_RESULT__OK:" + outputPath);

  } catch (e) {
    log("[JSX] HIBA a flatten soran: " + e.message);
    // Cleanup: dupDoc bezarasa ha nyitva maradt
    try { if (dupDoc) { dupDoc.close(SaveOptions.DONOTSAVECHANGES); } } catch (_) {}
  }
  app.displayDialogs = _origDlg;
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
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

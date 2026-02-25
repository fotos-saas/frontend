/**
 * save-and-close.jsx — Aktiv dokumentum mentese es bezarasa
 *
 * Mukodes:
 * 1. Dokumentum aktivalasa (TARGET_DOC_NAME / PSD_FILE_PATH alapjan)
 * 2. Mentes PSD formatumban (explicit eleresi uttal a PSD_FILE_PATH-bol)
 * 3. Bezaras (DONOTSAVECHANGES — mar mentettuk)
 *
 * Visszateres: "OK" vagy hibauzenet
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

(function () {
  try {
    if (app.documents.length === 0) {
      throw new Error("Nincs megnyitott dokumentum!");
    }

    // Dokumentum aktivalasa (ha tobb van nyitva)
    var doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + doc.name);

    // Mentes — SaveAs PSD formatumban az explicit eleresi utra
    // doc.save() nem megbizhato ha a dokumentumot programmatikusan hoztuk letre,
    // mert a Photoshop "Save As" dialogot nyithat. SaveAs explicit File-lal biztonsagosabb.
    var savePath = CONFIG.PSD_FILE_PATH;
    if (savePath) {
      var psdOpts = new PhotoshopSaveOptions();
      psdOpts.layers = true;
      psdOpts.embedColorProfile = true;
      psdOpts.annotations = true;
      doc.saveAs(new File(savePath), psdOpts, true, Extension.LOWERCASE);
      log("[JSX] Mentve: " + savePath);
    } else {
      // Fallback: ha nincs explicit ut, probaljuk a sima save()-et
      doc.save();
      log("[JSX] Mentve (save fallback)");
    }

    // Bezaras (mar mentettuk, nem kell ujra)
    doc.close(SaveOptions.DONOTSAVECHANGES);
    log("[JSX] Bezarva");

    log("__SAVE_CLOSE__OK");
  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

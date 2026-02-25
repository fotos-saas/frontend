/**
 * save-and-close.jsx — Aktiv dokumentum mentese es bezarasa
 *
 * Mukodes:
 * 1. Dokumentum aktivalasa (TARGET_DOC_NAME / PSD_FILE_PATH alapjan)
 * 2. Mentes (save — PSD formatumban, a meglevo eleresi utra)
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

    // Mentes
    doc.save();
    log("[JSX] Mentve");

    // Bezaras (mar mentettuk, nem kell ujra)
    doc.close(SaveOptions.DONOTSAVECHANGES);
    log("[JSX] Bezarva");

    log("__SAVE_CLOSE__OK");
  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

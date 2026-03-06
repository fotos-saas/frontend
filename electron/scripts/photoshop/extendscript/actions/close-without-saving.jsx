/**
 * close-without-saving.jsx — Dokumentum bezarasa mentes nelkul
 *
 * Batch ujrageneralashoz: ha mar van nyitva a PSD, bezarjuk mentes nelkul.
 * Ha nincs megnyitva a dokumentum, nem tortenik semmi (OK valasz).
 *
 * Visszateres: "__CLOSE_NOSAVE__OK" vagy hibauzenet
 */

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

(function () {
  try {
    if (app.documents.length === 0) {
      log("[JSX] Nincs megnyitott dokumentum — kihagyjuk");
      log("__CLOSE_NOSAVE__OK");
      return;
    }

    // Dokumentum aktivalasa (ha tobb van nyitva)
    var doc;
    try {
      doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    } catch (e) {
      // Ha a dokumentum nem talalhato, nem baj
      log("[JSX] Dokumentum nem talalhato: " + CONFIG.TARGET_DOC_NAME + " — kihagyjuk");
      log("__CLOSE_NOSAVE__OK");
      return;
    }

    log("[JSX] Bezaras mentes nelkul: " + doc.name);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    log("__CLOSE_NOSAVE__OK");
  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

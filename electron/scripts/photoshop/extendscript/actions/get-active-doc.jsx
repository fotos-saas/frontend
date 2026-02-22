/**
 * get-active-doc.jsx — Aktiv dokumentum informacioinak kiolvasasa
 *
 * Visszaadja az aktiv PSD/PSB nevet, teljes eleresi utjat es mappa utjat.
 * Ha nincs megnyitott dokumentum, ures JSON-t ad vissza.
 *
 * Kimenet (JSON string):
 *   { "name": "projekt-12.psb", "path": "/Users/.../projekt-12.psb", "dir": "/Users/.../" }
 *   VAGY ha nincs dokumentum:
 *   { "name": null, "path": null, "dir": null }
 */

// #include "../lib/config.jsx"

// Nincs megnyitott dokumentum?
if (app.documents.length === 0) {
  '{"name":null,"path":null,"dir":null}';
} else {
  var doc = app.activeDocument;
  var docName = doc.name;
  var docPath = "";
  var docDir = "";

  try {
    // A saved property true ha mar volt mentve (van fizikai fajl)
    if (doc.saved || doc.fullName) {
      docPath = doc.fullName.fsName; // OS-native path (macOS: /Users/..., Win: C:\...)
      var parentFolder = doc.fullName.parent;
      docDir = parentFolder.fsName;
    }
  } catch (e) {
    // Uj, mentetlen dokumentum — path ures marad
  }

  // JSON stringify kezzel (ExtendScript ES3, nincs JSON.stringify)
  var result = '{"name":"' + docName.replace(/"/g, '\\"') + '"';
  result += ',"path":"' + docPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  result += ',"dir":"' + docDir.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"}';
  result;
}

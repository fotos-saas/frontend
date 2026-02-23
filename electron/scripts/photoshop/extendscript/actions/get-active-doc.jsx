/**
 * get-active-doc.jsx — Aktiv dokumentum informacioinak kiolvasasa
 *
 * Visszaadja az aktiv PSD/PSB nevet, teljes eleresi utjat, mappa utjat
 * es a kijelolt layerek szamat.
 *
 * Kimenet (JSON string):
 *   { "name": "projekt-12.psb", "path": "/Users/...", "dir": "/Users/...", "selectedLayers": 3 }
 *   VAGY ha nincs dokumentum:
 *   { "name": null, "path": null, "dir": null, "selectedLayers": 0 }
 */

// #include "../lib/config.jsx"

// Nincs megnyitott dokumentum?
if (app.documents.length === 0) {
  '{"name":null,"path":null,"dir":null,"selectedLayers":0}';
} else {
  var doc = app.activeDocument;
  var docName = doc.name;
  var docPath = "";
  var docDir = "";
  var selectedCount = 0;

  try {
    if (doc.saved || doc.fullName) {
      docPath = doc.fullName.fsName;
      var parentFolder = doc.fullName.parent;
      docDir = parentFolder.fsName;
    }
  } catch (e) {}

  // Kijelolt layerek szama — ActionManager (megbizhato, gyors)
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("targetLayersIDs"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    var idList = desc.getList(stringIDToTypeID("targetLayersIDs"));
    selectedCount = idList.count;
  } catch (e2) {
    // Fallback: legalabb 1 (az activeLayer mindig letezik)
    selectedCount = 1;
  }

  var result = '{"name":"' + docName.replace(/"/g, '\\"') + '"';
  result += ',"path":"' + docPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  result += ',"dir":"' + docDir.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  result += ',"selectedLayers":' + selectedCount + '}';
  result;
}

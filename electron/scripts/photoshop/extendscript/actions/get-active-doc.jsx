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

  // Kijelolt layerek szama + nevei — ActionManager (megbizhato, gyors)
  var layerNames = [];
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("targetLayersIDs"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    var idList = desc.getList(stringIDToTypeID("targetLayersIDs"));
    selectedCount = idList.count;

    // Layer nevek kiolvasasa layerID alapjan
    for (var i = 0; i < idList.count; i++) {
      try {
        var layerId = idList.getReference(i).getIdentifier();
        var lRef = new ActionReference();
        lRef.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Nm  "));
        lRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
        var lDesc = executeActionGet(lRef);
        var lName = lDesc.getString(charIDToTypeID("Nm  "));
        layerNames.push(lName);
      } catch (e3) {
        // Nem olvasható layer — skip
      }
    }
  } catch (e2) {
    // Fallback: legalabb 1 (az activeLayer mindig letezik)
    selectedCount = 1;
  }

  // selectedLayerNames JSON tomb osszeallitasa
  var namesJson = "[";
  for (var n = 0; n < layerNames.length; n++) {
    if (n > 0) namesJson += ",";
    namesJson += '"' + layerNames[n].replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }
  namesJson += "]";

  var result = '{"name":"' + docName.replace(/"/g, '\\"') + '"';
  result += ',"path":"' + docPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  result += ',"dir":"' + docDir.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  result += ',"selectedLayers":' + selectedCount;
  result += ',"selectedLayerNames":' + namesJson + '}';
  result;
}

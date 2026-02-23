/**
 * unlink-selected.jsx — Kijelolt layerek linkelese megszuntetese nev alapjan
 *
 * Bemenet: NINCS (a kijelolt layerekbol indul ki)
 *
 * Mukodes:
 * 1. Lekerdezi a kijelolt layerek neveit (ActionManager)
 * 2. Minden nevre megkeresi az OSSZES azonos nevu layert a dokumentumban
 * 3. Mindegyiken futtatja a layer.unlink() DOM metodust
 *
 * Kimenet: JSON { "unlinked": 5, "names": ["bela---2342", "agi---2243"] }
 */

// #include "../lib/config.jsx"

var _logLines = [];
function log(msg) { _logLines.push(msg); }

// --- Kijelolt layerek neveinek lekerdezese ActionManager-rel ---
function getSelectedLayerNames() {
  var names = [];
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("targetLayersIDs"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    var idList = desc.getList(stringIDToTypeID("targetLayersIDs"));

    for (var i = 0; i < idList.count; i++) {
      var layerId = idList.getReference(i).getIdentifier();
      var layerRef = new ActionReference();
      layerRef.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Nm  "));
      layerRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
      var layerDesc = executeActionGet(layerRef);
      var layerName = layerDesc.getString(charIDToTypeID("Nm  "));
      names.push(layerName);
    }
  } catch (e) {
    log("[JSX] Kijelolt layerek lekerdezese sikertelen: " + e.message);
  }
  return names;
}

// --- Rekurziv layer kereses nev alapjan ---
function findLayersByName(container, targetName, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === targetName) {
        result.push(container.artLayers[i]);
      }
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      findLayersByName(container.layerSets[j], targetName, result);
    }
  } catch (e) {}
}

(function () {
  try {
    if (app.documents.length === 0) {
      '{"unlinked":0,"names":[]}';
      return;
    }
    var doc = app.activeDocument;

    var selectedNames = getSelectedLayerNames();
    if (selectedNames.length === 0) {
      '{"unlinked":0,"names":[]}';
      return;
    }

    // Egyedi nevek
    var uniqueNames = [];
    var nameMap = {};
    for (var i = 0; i < selectedNames.length; i++) {
      if (!nameMap[selectedNames[i]]) {
        nameMap[selectedNames[i]] = true;
        uniqueNames.push(selectedNames[i]);
      }
    }

    // Nevenként megkeressuk az osszes azonos nevu layert es unlinkeljuk
    var totalUnlinked = 0;
    var unlinkedNames = [];
    for (var n = 0; n < uniqueNames.length; n++) {
      var found = [];
      findLayersByName(doc, uniqueNames[n], found);

      var count = 0;
      for (var f = 0; f < found.length; f++) {
        try {
          found[f].unlink();
          count++;
        } catch (e) { /* nem linkelt — skip */ }
      }
      if (count > 0) {
        totalUnlinked += count;
        unlinkedNames.push(uniqueNames[n]);
      }
    }

    var namesJson = "[";
    for (var k = 0; k < unlinkedNames.length; k++) {
      if (k > 0) namesJson += ",";
      namesJson += "\"" + unlinkedNames[k].replace(/"/g, '\\"') + "\"";
    }
    namesJson += "]";

    var result = '{"unlinked":' + totalUnlinked + ',"names":' + namesJson + '}';
    result;

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    '{"unlinked":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();

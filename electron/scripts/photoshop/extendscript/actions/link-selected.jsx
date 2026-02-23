/**
 * link-selected.jsx — Kijelolt layerek osszelinkelese nev alapjan
 *
 * Bemenet: NINCS (a kijelolt layerekbol indul ki)
 *
 * Mukodes:
 * 1. Lekerdezi a kijelolt layerek neveit (ActionManager)
 * 2. Minden nevre megkeresi az OSSZES azonos nevu layert a dokumentumban
 *    (Images + Names csoportokban is, igy a kep es a nev ossze lesz linkelve)
 * 3. Nev-csoportonkent kijeloli oket es linkeli
 *
 * Kimenet: JSON { "linked": 5, "names": ["bela---2342", "agi---2243"] }
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
      // Layer nev lekerdezese ID alapjan
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

// --- Tobb layer kijelolese ID alapjan ---
function selectLayersById(layerIds) {
  if (layerIds.length === 0) return;
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerIds[0]);
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);

  for (var i = 1; i < layerIds.length; i++) {
    var addDesc = new ActionDescriptor();
    var addRef = new ActionReference();
    addRef.putIdentifier(charIDToTypeID("Lyr "), layerIds[i]);
    addDesc.putReference(charIDToTypeID("null"), addRef);
    addDesc.putEnumerated(
      stringIDToTypeID("selectionModifier"),
      stringIDToTypeID("selectionModifierType"),
      stringIDToTypeID("addToSelection")
    );
    executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
  }
}

// --- Link action ---
function linkSelected() {
  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

(function () {
  try {
    if (app.documents.length === 0) {
      '{"linked":0,"names":[]}';
      return;
    }
    var doc = app.activeDocument;

    // 1. Kijelolt layerek nevei
    var selectedNames = getSelectedLayerNames();
    if (selectedNames.length === 0) {
      '{"linked":0,"names":[]}';
      return;
    }

    // 2. Egyedi nevek (duplikaciok kiszurese)
    var uniqueNames = [];
    var nameMap = {};
    for (var i = 0; i < selectedNames.length; i++) {
      if (!nameMap[selectedNames[i]]) {
        nameMap[selectedNames[i]] = true;
        uniqueNames.push(selectedNames[i]);
      }
    }

    // 3. Nevenként megkeressuk az osszes azonos nevu layert es linkeljuk
    var totalLinked = 0;
    var linkedNames = [];
    for (var n = 0; n < uniqueNames.length; n++) {
      var found = [];
      findLayersByName(doc, uniqueNames[n], found);

      if (found.length >= 2) {
        var ids = [];
        for (var f = 0; f < found.length; f++) {
          ids.push(found[f].id);
        }
        selectLayersById(ids);
        linkSelected();
        totalLinked += found.length;
        linkedNames.push(uniqueNames[n]);
      }
    }

    // JSON stringify kezzel (ES3)
    var namesJson = "[";
    for (var k = 0; k < linkedNames.length; k++) {
      if (k > 0) namesJson += ",";
      namesJson += "\"" + linkedNames[k].replace(/"/g, '\\"') + "\"";
    }
    namesJson += "]";

    var result = '{"linked":' + totalLinked + ',"names":' + namesJson + '}';
    result;

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    '{"linked":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();

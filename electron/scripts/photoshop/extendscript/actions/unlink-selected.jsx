/**
 * unlink-selected.jsx — Kijelolt layerek linkelese megszuntetese nev alapjan
 *
 * Bemenet: NINCS (a kijelolt layerekbol indul ki)
 *
 * Mukodes:
 * 1. Lekerdezi a kijelolt layerek neveit (ActionManager)
 * 2. EGYETLEN bejarassal megkeresi az OSSZES azonos nevu layert (batch)
 * 3. Mindegyiken futtatja a layer.unlink() DOM metodust
 * 4. suspendHistory: egyetlen Undo lepes
 *
 * Kimenet: JSON { "unlinked": 5, "names": ["bela---2342", "agi---2243"] }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) { _logLines.push(msg); }

// --- JSON string escape (ES3) ---
function escapeJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

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

// --- BATCH: Egyetlen bejarassal tobb nevet keres, resultMap-be gyujt ---
function findLayersByNames(container, nameSet, resultMap) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var name = container.artLayers[i].name;
      if (nameSet[name]) {
        if (!resultMap[name]) resultMap[name] = [];
        resultMap[name].push(container.artLayers[i]);
      }
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      findLayersByNames(container.layerSets[j], nameSet, resultMap);
    }
  } catch (e) {}
}

// Globalis valtozo az eredmenyhez (suspendHistory nem ad vissza return-t)
var _unlinkResult = '{"unlinked":0,"names":[]}';

// --- Fo logika ---
function doUnlinkAll() {
  var doc = app.activeDocument;

  // Layer nevek: CONFIG.LAYER_NAMES-bol VAGY kijelolt layerekbol
  var selectedNames;
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.LAYER_NAMES) {
      selectedNames = CONFIG.LAYER_NAMES.split('|');
    }
  } catch (e) {}
  if (!selectedNames || selectedNames.length === 0) {
    selectedNames = getSelectedLayerNames();
  }
  if (selectedNames.length === 0) {
    _unlinkResult = '{"unlinked":0,"names":[]}';
    return;
  }

  // Egyedi nevek + nameSet
  var uniqueNames = [];
  var nameSet = {};
  for (var i = 0; i < selectedNames.length; i++) {
    if (!nameSet[selectedNames[i]]) {
      nameSet[selectedNames[i]] = true;
      uniqueNames.push(selectedNames[i]);
    }
  }

  // EGYETLEN bejaras
  var resultMap = {};
  findLayersByNames(doc, nameSet, resultMap);

  // Unlink minden talalatra
  var totalUnlinked = 0;
  var unlinkedNames = [];
  for (var n = 0; n < uniqueNames.length; n++) {
    var found = resultMap[uniqueNames[n]];
    if (!found) continue;
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

  // Vegso kijeles: CSAK Images csoport layerei maradjanak kijelelve
  var imagesGroup = null;
  try { imagesGroup = doc.layerSets.getByName("Images"); } catch (e) {}
  if (imagesGroup && unlinkedNames.length > 0) {
    var finalIds = [];
    var collectImageIds = function(container) {
      try {
        for (var ci = 0; ci < container.artLayers.length; ci++) {
          if (nameSet[container.artLayers[ci].name]) {
            finalIds.push(container.artLayers[ci].id);
          }
        }
      } catch (e) {}
      try {
        for (var si2 = 0; si2 < container.layerSets.length; si2++) {
          collectImageIds(container.layerSets[si2]);
        }
      } catch (e) {}
    };
    collectImageIds(imagesGroup);
    if (finalIds.length > 0) {
      selectMultipleLayersById(finalIds);
    }
  }

  var namesJson = "[";
  for (var k = 0; k < unlinkedNames.length; k++) {
    if (k > 0) namesJson += ",";
    namesJson += "\"" + escapeJsonStr(unlinkedNames[k]) + "\"";
  }
  namesJson += "]";

  _unlinkResult = '{"unlinked":' + totalUnlinked + ',"names":' + namesJson + '}';
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Unlink layers", "doUnlinkAll()");
  }
} catch (e) {
  _unlinkResult = '{"unlinked":0,"error":"' + escapeJsonStr(e.message) + '"}';
}

_unlinkResult;

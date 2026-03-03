/**
 * link-selected.jsx — Kijelolt layerek osszelinkelese nev alapjan
 *
 * Bemenet: NINCS (a kijelolt layerekbol indul ki)
 *
 * Mukodes:
 * 1. Lekerdezi a kijelolt layerek neveit (ActionManager)
 * 2. EGYETLEN bejarassal megkeresi az OSSZES azonos nevu layert (batch)
 * 3. Nev-csoportonkent batch kijeloles + linkeles
 * 4. suspendHistory: egyetlen Undo lepes
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

// --- BATCH: Tobb layer kijelolese egyetlen ActionList-tel ---
function selectLayersById(ids) {
  if (ids.length === 0) return;
  var desc = new ActionDescriptor();
  var refs = new ActionList();
  for (var i = 0; i < ids.length; i++) {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), ids[i]);
    refs.putReference(ref);
  }
  desc.putList(charIDToTypeID("null"), refs);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}

// --- Link action ---
function linkSelected() {
  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

// Globalis valtozo az eredmenyhez (suspendHistory nem ad vissza return-t)
var _linkResult = '{"linked":0,"names":[]}';

// --- Fo logika ---
function doLinkAll() {
  var doc = app.activeDocument;
  // 1. Kijelolt layerek nevei
  var selectedNames = getSelectedLayerNames();
  if (selectedNames.length === 0) {
    _linkResult = '{"linked":0,"names":[]}';
    return;
  }

  // 2. Egyedi nevek + nameSet (O(1) lookup)
  var uniqueNames = [];
  var nameSet = {};
  for (var i = 0; i < selectedNames.length; i++) {
    if (!nameSet[selectedNames[i]]) {
      nameSet[selectedNames[i]] = true;
      uniqueNames.push(selectedNames[i]);
    }
  }

  // 3. EGYETLEN bejaras — osszes nev egyszerre
  var resultMap = {};
  findLayersByNames(doc, nameSet, resultMap);

  // 4. Nev-csoportonkent batch kijeloles + linkeles
  var totalLinked = 0;
  var linkedNames = [];
  for (var n = 0; n < uniqueNames.length; n++) {
    var found = resultMap[uniqueNames[n]];
    if (found && found.length >= 2) {
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

  _linkResult = '{"linked":' + totalLinked + ',"names":' + namesJson + '}';
}

(function () {
  try {
    if (app.documents.length === 0) {
      '{"linked":0,"names":[]}';
      return;
    }
    var doc = app.activeDocument;

    // suspendHistory: egyetlen Undo lepes az egesz muvelethez
    doc.suspendHistory("Link layers", "doLinkAll()");
    _linkResult;

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    '{"linked":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();

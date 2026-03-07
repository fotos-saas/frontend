/**
 * link-selected.jsx — Layerek osszelinkelese ID alapjan
 *
 * Bemenet: CONFIG.LAYER_NAMES (pipe-szeparalt Image layer nevek) VAGY kijelolt layerek
 *
 * Mukodes:
 * 1. Image layer nevekbol kiszedi a ---ID reszt
 * 2. EGYETLEN bejarassal megkeresi az OSSZES azonos ID-ju layert (batch)
 *    Igy akkor is linkel ha a slug mas (pl. nev valtozas utan)
 * 3. ID-csoportonkent batch kijeloles + linkeles
 * 4. suspendHistory: egyetlen Undo lepes
 *
 * Kimenet: JSON { "linked": 5, "names": ["bela---2342", "agi---2243"] }
 */

// #include "../lib/config.jsx"

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

// --- BATCH: Egyetlen bejarassal ID alapjan keres, resultMap-be gyujt ---
// idToName: {"---42": "slug---42", ...} — a layer ---ID resze alapjan csoportosit
function findLayersByIds(container, idToName, resultMap) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var name = container.artLayers[i].name;
      var sep = name.indexOf("---");
      if (sep === -1) continue;
      var idPart = name.substring(sep); // "---42"
      var originalName = idToName[idPart];
      if (originalName) {
        if (!resultMap[originalName]) resultMap[originalName] = [];
        resultMap[originalName].push(container.artLayers[i]);
      }
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      findLayersByIds(container.layerSets[j], idToName, resultMap);
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

// Globalis valtozo az eredmenyhez (suspendHistory nem ad vissza return-t)
var _linkResult = '{"linked":0,"names":[]}';

// --- Fo logika ---
function doLinkAll() {
  var doc = app.activeDocument;

  // 1. Layer nevek: CONFIG.LAYER_NAMES-bol VAGY kijelolt layerekbol
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

  // 3. ID-alapu lookup map epitese: "---42" → "slug---42"
  var idToName = {};
  for (var m = 0; m < uniqueNames.length; m++) {
    var sep = uniqueNames[m].indexOf("---");
    if (sep !== -1) {
      var idPart = uniqueNames[m].substring(sep); // "---42"
      idToName[idPart] = uniqueNames[m];
    }
  }

  // 4. EGYETLEN bejaras — ID alapjan keres az egesz dokumentumban
  var resultMap = {};
  findLayersByIds(doc, idToName, resultMap);

  // 4. Nev-csoportonkent batch kijeloles + linkeles
  var totalLinked = 0;
  var linkedNames = [];
  var skippedNames = [];
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
    } else {
      skippedNames.push(uniqueNames[n]);
    }
  }

  // 5. Vegso kijeles: CSAK Images csoport layerei maradjanak kijelelve
  var imagesGroup = null;
  try { imagesGroup = doc.layerSets.getByName("Images"); } catch (e) {}
  if (imagesGroup && linkedNames.length > 0) {
    var finalIds = [];
    var collectImageIds = function(container) {
      try {
        for (var ci = 0; ci < container.artLayers.length; ci++) {
          var ln = container.artLayers[ci].name;
          var lnSep = ln.indexOf("---");
          if (lnSep !== -1 && idToName[ln.substring(lnSep)]) {
            finalIds.push(container.artLayers[ci].id);
          }
        }
      } catch (e) {}
      try {
        for (var si = 0; si < container.layerSets.length; si++) {
          collectImageIds(container.layerSets[si]);
        }
      } catch (e) {}
    };
    collectImageIds(imagesGroup);
    if (finalIds.length > 0) {
      selectLayersById(finalIds);
    }
  }

  // JSON stringify kezzel (ES3)
  var namesJson = "[";
  for (var k = 0; k < linkedNames.length; k++) {
    if (k > 0) namesJson += ",";
    namesJson += "\"" + escapeJsonStr(linkedNames[k]) + "\"";
  }
  namesJson += "]";

  _linkResult = '{"linked":' + totalLinked + ',"names":' + namesJson + '}';
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Link layers", "doLinkAll()");
  }
} catch (e) {
  _linkResult = '{"linked":0,"error":"' + escapeJsonStr(e.message) + '"}';
}

_linkResult;

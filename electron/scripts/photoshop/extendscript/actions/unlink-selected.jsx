/**
 * unlink-selected.jsx — Kijelolt layerek linkelese megszuntetese nev alapjan (OPTIMALIZALT)
 *
 * Bemenet: NINCS (a kijelolt layerekbol indul ki)
 *
 * Mukodes:
 * 1. Lekerdezi a kijelolt layerek neveit (ActionManager)
 * 2. ActionManager-rel bejarja a dokumentum layereit (NEM DOM!)
 * 3. Mindegyiken futtatja az unlink-ot
 * 4. suspendHistory: egyetlen Undo lepes
 *
 * Kimenet: JSON { "unlinked": 5, "names": ["bela---2342", "agi---2243"] }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) { _logLines.push(msg); }

function escapeJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

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
      names.push(layerDesc.getString(charIDToTypeID("Nm  ")));
    }
  } catch (e) {}
  return names;
}

// --- ActionManager-alapu layer bejaras: nev alapjan gyujt layer ID-kat ---
function collectLayerIdsByName(nameSet) {
  var result = {};
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("numberOfLayers"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var docDesc = executeActionGet(ref);
    var count = docDesc.getInteger(stringIDToTypeID("numberOfLayers"));

    var propName = charIDToTypeID("Nm  ");
    var propId = charIDToTypeID("LyrI");
    var propSection = stringIDToTypeID("layerSection");
    var classLayer = charIDToTypeID("Lyr ");

    for (var i = 1; i <= count; i++) {
      try {
        var lRef = new ActionReference();
        lRef.putIndex(classLayer, i);
        var lDesc = executeActionGet(lRef);

        var section = lDesc.getEnumerationValue(propSection);
        if (section === stringIDToTypeID("layerSectionStart") ||
            section === stringIDToTypeID("layerSectionEnd")) continue;

        var name = lDesc.getString(propName);
        if (!nameSet[name]) continue;

        var lid = lDesc.getInteger(propId);
        if (!result[name]) result[name] = [];
        result[name].push(lid);
      } catch (e) {}
    }
  } catch (e) {}
  return result;
}

var _unlinkResult = '{"unlinked":0,"names":[]}';

function doUnlinkAll() {
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

  var uniqueNames = [];
  var nameSet = {};
  for (var i = 0; i < selectedNames.length; i++) {
    if (!nameSet[selectedNames[i]]) {
      nameSet[selectedNames[i]] = true;
      uniqueNames.push(selectedNames[i]);
    }
  }

  // ActionManager bejaras
  var resultMap = collectLayerIdsByName(nameSet);

  // Unlink
  var totalUnlinked = 0;
  var unlinkedNames = [];
  for (var n = 0; n < uniqueNames.length; n++) {
    var found = resultMap[uniqueNames[n]];
    if (!found) continue;
    var count = 0;
    for (var f = 0; f < found.length; f++) {
      try {
        // Select + unlink
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putIdentifier(charIDToTypeID("Lyr "), found[f]);
        desc.putReference(charIDToTypeID("null"), ref);
        desc.putBoolean(charIDToTypeID("MkVs"), false);
        executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
        app.activeDocument.activeLayer.unlink();
        count++;
      } catch (e) {}
    }
    if (count > 0) {
      totalUnlinked += count;
      unlinkedNames.push(uniqueNames[n]);
    }
  }

  // Vegso kijeles
  if (unlinkedNames.length > 0) {
    var finalIds = [];
    for (var fn = 0; fn < unlinkedNames.length; fn++) {
      var ids = resultMap[unlinkedNames[fn]];
      if (ids) {
        for (var fi = 0; fi < ids.length; fi++) {
          finalIds.push(ids[fi]);
        }
      }
    }
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

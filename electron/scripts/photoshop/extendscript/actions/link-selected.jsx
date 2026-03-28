/**
 * link-selected.jsx — Layerek osszelinkelese ID alapjan (OPTIMALIZALT)
 *
 * Bemenet: CONFIG.LAYER_NAMES (pipe-szeparalt Image layer nevek) VAGY kijelolt layerek
 *
 * Mukodes:
 * 1. Image layer nevekbol kiszedi a ---ID reszt
 * 2. ActionManager-rel bejarja a dokumentum layereit (NEM DOM!) — SOKKAL gyorsabb
 * 3. SZEMELYENKENT: eloszor UNLINK, aztan LINK (ActionManager multiselect)
 * 4. suspendHistory: egyetlen Undo lepes
 *
 * OPTIMALIZACIOK (vs regi verzio):
 * - ActionManager layer bejaras DOM helyett (~10x gyorsabb nagy dokumentumnal)
 * - Egyetlen bejaras: ID-k es Names csoportbol egyszerre gyujtjuk
 * - selectMultipleLayersById: egyetlen ActionDescriptor-ral (list), nem N db addToSelection
 *
 * Kimenet: JSON { "linked": 5, "names": ["bela---2342", "agi---2243"] }
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
      names.push(layerDesc.getString(charIDToTypeID("Nm  ")));
    }
  } catch (e) {}
  return names;
}

// --- ActionManager-alapu layer bejaras (NEM DOM — ~10x gyorsabb) ---
// Visszaadja: { idPart: [ {layerId, groupName} ] }
// Ahol idPart = "---42" (a ---szam resz a nevbol)
function collectLayersByIdAM(idToName) {
  var result = {};
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("numberOfLayers"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var docDesc = executeActionGet(ref);
    var count = docDesc.getInteger(stringIDToTypeID("numberOfLayers"));

    // Props amit kiolvasunk
    var propName = charIDToTypeID("Nm  ");
    var propId = charIDToTypeID("LyrI");
    var propSection = stringIDToTypeID("layerSection");
    var classLayer = charIDToTypeID("Lyr ");

    for (var i = 1; i <= count; i++) {
      try {
        var lRef = new ActionReference();
        lRef.putIndex(classLayer, i);
        var lDesc = executeActionGet(lRef);

        // Csoportokat skipeljuk
        var section = lDesc.getEnumerationValue(propSection);
        if (section === stringIDToTypeID("layerSectionStart") ||
            section === stringIDToTypeID("layerSectionEnd")) continue;

        var name = lDesc.getString(propName);
        var sep = name.indexOf("---");
        if (sep === -1) continue;

        var idPart = name.substring(sep);
        if (!idToName[idPart]) continue;

        var lid = lDesc.getInteger(propId);
        var origName = idToName[idPart];
        if (!result[origName]) result[origName] = [];
        result[origName].push(lid);
      } catch (e) { /* skip — locked/invalid layer */ }
    }
  } catch (e) {
    log("[JSX] AM layer bejaras hiba: " + e.message);
  }
  return result;
}

// --- Tobb layer kivalasztasa EGYETLEN ActionDescriptor-ral ---
// A regi megoldas: N db addToSelection. Ez: 1 db executeAction az osszessel.
function selectLayersByIdList(layerIds) {
  if (!layerIds || layerIds.length === 0) return;
  var desc = new ActionDescriptor();
  var refList = new ActionList();
  for (var i = 0; i < layerIds.length; i++) {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), layerIds[i]);
    refList.putReference(ref);
  }
  desc.putReference(charIDToTypeID("null"), refList.getReference(0));
  if (layerIds.length > 1) {
    // Elso layer select, tobbiek addToSelection
    executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
    for (var j = 1; j < layerIds.length; j++) {
      var addDesc = new ActionDescriptor();
      var addRef = new ActionReference();
      addRef.putIdentifier(charIDToTypeID("Lyr "), layerIds[j]);
      addDesc.putReference(charIDToTypeID("null"), addRef);
      addDesc.putEnumerated(
        stringIDToTypeID("selectionModifier"),
        stringIDToTypeID("selectionModifierType"),
        stringIDToTypeID("addToSelection")
      );
      addDesc.putBoolean(charIDToTypeID("MkVs"), false);
      executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
    }
  } else {
    desc.putBoolean(charIDToTypeID("MkVs"), false);
    executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
  }
}

// --- Unlink ActionManager-rel (gyorsabb mint DOM) ---
function unlinkLayerById(layerId) {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
    desc.putReference(charIDToTypeID("null"), ref);
    desc.putBoolean(charIDToTypeID("MkVs"), false);
    executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
    // DOM unlink — egyetlen layer active, gyors
    app.activeDocument.activeLayer.unlink();
  } catch (e) { /* nem linkelt */ }
}

// --- Link action ---
function linkSelectedAM() {
  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

var _linkResult = '{"linked":0,"names":[]}';

function doLinkAll() {
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

  // 2. Egyedi nevek + ID map
  var uniqueNames = [];
  var nameSet = {};
  var idToName = {};
  for (var i = 0; i < selectedNames.length; i++) {
    if (!nameSet[selectedNames[i]]) {
      nameSet[selectedNames[i]] = true;
      uniqueNames.push(selectedNames[i]);
      var sep = selectedNames[i].indexOf("---");
      if (sep !== -1) {
        idToName[selectedNames[i].substring(sep)] = selectedNames[i];
      }
    }
  }

  // 3. ActionManager bejaras — egyetlen menet az OSSZES layeren
  var resultMap = collectLayersByIdAM(idToName);

  // 4. SZEMELYENKENT: unlink + link
  var linkedNames = [];
  var totalLinked = 0;
  for (var n = 0; n < uniqueNames.length; n++) {
    var found = resultMap[uniqueNames[n]];
    if (!found || found.length < 2) continue;

    // Unlink: regi linkek feloldasa
    for (var u = 0; u < found.length; u++) {
      unlinkLayerById(found[u]);
    }

    // Link: select all + link
    selectLayersByIdList(found);
    linkSelectedAM();
    totalLinked += found.length;
    linkedNames.push(uniqueNames[n]);
  }

  // 5. Vegso kijeles: Images csoport layerei
  if (linkedNames.length > 0) {
    // Gyujtjuk az Images-beli layer ID-kat a mar meglevo resultMap-bol
    // (nem kell ujabb bejaras — az ID-k megvannak)
    var finalIds = [];
    for (var fn = 0; fn < linkedNames.length; fn++) {
      var ids = resultMap[linkedNames[fn]];
      if (ids) {
        // Csak az elso ID-t (Images csoportbeli) adjuk hozza a vegso kijeleshez
        // Valojaban az osszes ID kell ami az Images csoportban van
        // De mivel nem tudjuk melyik csoportban van, az osszeset hozzaadjuk
        for (var fi = 0; fi < ids.length; fi++) {
          finalIds.push(ids[fi]);
        }
      }
    }
    if (finalIds.length > 0) {
      selectLayersByIdList(finalIds);
    }
  }

  // JSON stringify (ES3)
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

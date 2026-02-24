/**
 * align-linked.jsx — Kijelolt layerek igazitasa linkelt tarsaikkal egyutt
 *
 * Bemenet (CONFIG jeloles):
 *   CONFIG.ALIGN_TYPE = "left" | "centerH" | "right" | "top" | "centerV" | "bottom"
 *
 * Mukodes:
 * 1. Kijelolt layerek neveinek lekerdezese
 * 2. Minden nevhez megkeresi az osszes azonos nevu layert (kep + nev)
 * 3. Megjegyzi a poziciojukat (deltaX, deltaY a "fo" layerhez kepest)
 * 4. Vegrehajta a PS align-t CSAK a fo layereken
 * 5. Kiszamolja mennyit mozgott a fo layer
 * 6. A linkelt tarsakat ugyanannyival eltolja
 *
 * Kimenet: JSON { "aligned": 5 }
 */

// #include "../lib/config.jsx"

// --- Kijelolt layerek ID + nev lekerdezese ---
function getSelectedLayerInfo() {
  var layers = [];
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
      layers.push({ id: layerId, name: layerName });
    }
  } catch (e) {}
  return layers;
}

// --- Layer bounds lekerdezese ID alapjan [left, top, right, bottom] ---
function getLayerBounds(layerId) {
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("bounds"));
  ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
  var desc = executeActionGet(ref);
  var bounds = desc.getObjectValue(stringIDToTypeID("bounds"));
  return {
    left: bounds.getUnitDoubleValue(stringIDToTypeID("left")),
    top: bounds.getUnitDoubleValue(stringIDToTypeID("top")),
    right: bounds.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: bounds.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
}

// --- Rekurziv layer kereses nev alapjan → ID lista ---
function findLayerIdsByName(container, targetName, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === targetName) {
        result.push(container.artLayers[i].id);
      }
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      findLayerIdsByName(container.layerSets[j], targetName, result);
    }
  } catch (e) {}
}

// --- Layer mozgatasa ID alapjan delta pixel-lel ---
function moveLayerById(layerId, dx, dy) {
  if (dx === 0 && dy === 0) return;
  // Kivalasztjuk a layert
  var selDesc = new ActionDescriptor();
  var selRef = new ActionReference();
  selRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
  selDesc.putReference(charIDToTypeID("null"), selRef);
  executeAction(charIDToTypeID("slct"), selDesc, DialogModes.NO);

  // Mozgatas
  var moveDesc = new ActionDescriptor();
  moveDesc.putEnumerated(charIDToTypeID("null"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var offsetDesc = new ActionDescriptor();
  offsetDesc.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), dx);
  offsetDesc.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), dy);
  moveDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Ofst"), offsetDesc);
  executeAction(charIDToTypeID("move"), moveDesc, DialogModes.NO);
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

// --- PS Align parancs ---
function executeAlign(alignType) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);

  // Az align a dokumentum bounding box-hoz igazit ha 1 layer van kijelolve,
  // tobbnel a kijeloles bounding box-ahoz
  // "Using" = document canvas
  desc.putEnumerated(stringIDToTypeID("using"), stringIDToTypeID("alignDistributeSelector"), stringIDToTypeID("ADSCanvas"));

  var alignMap = {
    "left":    "ADSLefts",
    "centerH": "ADSCentersH",
    "right":   "ADSRights",
    "top":     "ADSTops",
    "centerV": "ADSCentersV",
    "bottom":  "ADSBottoms"
  };
  var alignKey = alignMap[alignType];
  if (!alignKey) return;

  desc.putEnumerated(stringIDToTypeID("alignToCanvas"), stringIDToTypeID("boolean"), stringIDToTypeID("false"));
  executeAction(stringIDToTypeID("align"), desc, DialogModes.NO);
}

(function () {
  try {
    if (app.documents.length === 0) {
      '{"aligned":0}';
      return;
    }
    var doc = app.activeDocument;
    var alignType = typeof CONFIG !== "undefined" && CONFIG.ALIGN_TYPE ? CONFIG.ALIGN_TYPE : "left";

    // 1. Kijelolt layerek info
    var selected = getSelectedLayerInfo();
    if (selected.length === 0) {
      '{"aligned":0}';
      return;
    }

    // 2. Egyedi nevek es a hozzajuk tartozo layerek (fo layer = kijelolt, tarsak = azonos nevu)
    var nameMap = {}; // name -> { mainId, siblingIds[], beforeBounds }
    for (var i = 0; i < selected.length; i++) {
      var name = selected[i].name;
      if (nameMap[name]) continue; // mar feldolgoztuk

      // Fo layer bounds megjegyzese
      var mainBounds = getLayerBounds(selected[i].id);

      // Osszes azonos nevu layer (tarsak)
      var allIds = [];
      findLayerIdsByName(doc, name, allIds);

      // Szures: a fo layert es a tarsakat kulon valasztjuk
      var siblingIds = [];
      var siblingBefore = [];
      for (var j = 0; j < allIds.length; j++) {
        if (allIds[j] !== selected[i].id) {
          siblingIds.push(allIds[j]);
          siblingBefore.push(getLayerBounds(allIds[j]));
        }
      }

      nameMap[name] = {
        mainId: selected[i].id,
        mainBefore: mainBounds,
        siblingIds: siblingIds,
        siblingBefore: siblingBefore
      };
    }

    // 3. Kijelolt layereken vegrehajtas: PS align
    // Csak a fo layereket jeloljuk ki
    var mainIds = [];
    for (var n in nameMap) {
      mainIds.push(nameMap[n].mainId);
    }
    selectLayersById(mainIds);
    executeAlign(alignType);

    // 4. Fo layerek uj pozicioja → delta szamitas → tarsak mozgatasa
    var totalAligned = 0;
    for (var n2 in nameMap) {
      var entry = nameMap[n2];
      var mainAfter = getLayerBounds(entry.mainId);
      var dx = mainAfter.left - entry.mainBefore.left;
      var dy = mainAfter.top - entry.mainBefore.top;

      // Tarsak mozgatasa
      for (var s = 0; s < entry.siblingIds.length; s++) {
        moveLayerById(entry.siblingIds[s], dx, dy);
        totalAligned++;
      }
      totalAligned++; // fo layer
    }

    // 5. Eredeti kijeloles visszaallitasa
    selectLayersById(mainIds);

    '{"aligned":' + totalAligned + '}';

  } catch (e) {
    '{"aligned":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();

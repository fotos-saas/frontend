/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan
 *
 * Fazis 0: linkLayers — Image + Names + Positions layerek osszelinkelese nev alapjan
 * Fazis 1: moveLayersToBottomInGroup — Images layer STACK sorrend
 * Fazis 2: rearrangeGroupLayersAndPositions — fizikai poziciok atrendezese
 *          A linkeles miatt a Names/Positions layerek automatikusan kovetik a kepeket
 * A linkelés megmarad — a layerek össze vannak kapcsolva a rendezés után is
 *
 * CONFIG bemenet:
 *   ORDERED_NAMES = JSON string tomb: ["slug1---123", "slug2---456", ...]
 *   GROUP = "Students" | "Teachers" | "All"
 *
 * Kimenet: JSON { "reordered": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _doc, _orderedNames, _groupFilter, _reorderResult;

// ========== PRODUCTION: getLayerTransformedBounds (layer.jsx:178) ==========

function getLayerTransformedBounds(layer) {
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID('Lyr '), layer.id);
  var desc = executeActionGet(ref);
  var boundsDesc = desc.getObjectValue(stringIDToTypeID('boundsNoEffects'));
  return {
    left: boundsDesc.getUnitDoubleValue(stringIDToTypeID('left')),
    top: boundsDesc.getUnitDoubleValue(stringIDToTypeID('top')),
    right: boundsDesc.getUnitDoubleValue(stringIDToTypeID('right')),
    bottom: boundsDesc.getUnitDoubleValue(stringIDToTypeID('bottom'))
  };
}

// ========== PRODUCTION: moveLayerToPosition (layer.jsx:193) ==========

function moveLayerToPosition(layer, x, y) {
  var bounds = getLayerTransformedBounds(layer);
  var deltaX = x - bounds.left;
  var deltaY = y - bounds.top;
  layer.translate(deltaX, deltaY);
}

// ========== PRODUCTION: moveLayersToBottomInGroup (move-layers-to-bottom-in-group.jsx) ==========

function moveLayersToBottomInGroup(group, layers) {
  var tempGroup = group.layerSets.add();
  tempGroup.name = "Temporary Group";

  for (var i = 0; i < layers.length; i++) {
    layers[i].move(tempGroup, ElementPlacement.INSIDE);
  }

  for (var j = layers.length - 1; j >= 0; j--) {
    tempGroup.artLayers[j].move(group, ElementPlacement.PLACEATEND);
  }

  tempGroup.remove();
}

// ========== Tobb layer kijelolese ID alapjan (ActionManager) ==========

function _selectMultipleLayersById(layerIds) {
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

// ========== FAZIS 0: Image + Names + Positions layerek osszelinkelese ==========
// Minden image layer-hez megkeresi az azonos nevu Names es Positions layert,
// majd PS nativ "Link Layers" funkcio-val osszekapcsolja oket.
// A linkeles megmarad — a felhasznalo igy latja a Layers panelen is.

function _linkLayersForGroup(subName) {
  var imgGrp = getGroupByPath(_doc, ["Images", subName]);
  if (!imgGrp) return;

  var namesGrp = getGroupByPath(_doc, ["Names", subName]);
  var posGrp = getGroupByPath(_doc, ["Positions", subName]);

  for (var i = 0; i < imgGrp.artLayers.length; i++) {
    var imgLayer = imgGrp.artLayers[i];
    var lName = imgLayer.name;
    var ids = [imgLayer.id];

    // Names par keresese
    if (namesGrp) {
      try {
        for (var n = 0; n < namesGrp.artLayers.length; n++) {
          if (namesGrp.artLayers[n].name === lName) {
            ids.push(namesGrp.artLayers[n].id);
            break;
          }
        }
      } catch(e) {}
    }

    // Positions par keresese
    if (posGrp) {
      try {
        for (var p = 0; p < posGrp.artLayers.length; p++) {
          if (posGrp.artLayers[p].name === lName) {
            ids.push(posGrp.artLayers[p].id);
            break;
          }
        }
      } catch(e) {}
    }

    // Linkelés: csak ha 2+ layer van (image + legalabb egy par)
    if (ids.length >= 2) {
      _selectMultipleLayersById(ids);
      var linkDesc = new ActionDescriptor();
      var linkRef = new ActionReference();
      linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
      linkDesc.putReference(charIDToTypeID("null"), linkRef);
      executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
    }
  }
}

// ========== PRODUCTION: rearrangeGroupLayersAndPositions (organize-layers-by-current-position.jsx:35) ==========

function rearrangeGroupLayersAndPositions(imageLayerGroup) {
  var imageLayers = imageLayerGroup.artLayers;

  // 1. Slot poziciok kimentese — FORDÍTOTT sorrendben (production: i = length-1 .. 0)
  var layerPositions = [];
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var bounds = getLayerTransformedBounds(imageLayers[i]);
    layerPositions.push({ x: bounds.left, y: bounds.top });
  }

  // 2. Rendezzuk Y, majd X szerint (ROW_THRESHOLD: 20px sor csoportositas)
  var ROW_THRESHOLD = 20;
  layerPositions.sort(function (a, b) {
    if (Math.abs(a.y - b.y) <= ROW_THRESHOLD) return a.x - b.x;
    return a.y - b.y;
  });

  // 3. Reverse (production minta: layerPositions = layerPositions.reverse())
  layerPositions = layerPositions.reverse();

  // 4. Image layerek mozgatasa — a linkeles miatt Names/Positions is kovetik
  for (var k = 0; k < layerPositions.length; k++) {
    moveLayerToPosition(imageLayers[k], layerPositions[k].x, layerPositions[k].y);
  }
}

// ========== JSON parser ==========

function parseJsonArray(str) {
  var result = [];
  str = str.replace(/^\s*\[/, "").replace(/\]\s*$/, "");
  if (str.length === 0) return result;
  var parts = str.split(",");
  for (var i = 0; i < parts.length; i++) {
    var s = parts[i].replace(/^\s*"/, "").replace(/"\s*$/, "");
    result.push(s);
  }
  return result;
}

// ========== FO LOGIKA ==========

function _doReorderLayers() {
  var imagesGroup = getGroupByPath(_doc, ["Images"]);
  if (!imagesGroup) { _reorderResult = '{"reordered":0,"error":"No Images group"}'; return; }

  var subGroups = [];
  if (_groupFilter === "All" || _groupFilter === "Students") subGroups.push("Students");
  if (_groupFilter === "All" || _groupFilter === "Teachers") subGroups.push("Teachers");

  var totalReordered = 0;

  for (var sg = 0; sg < subGroups.length; sg++) {
    var subName = subGroups[sg];
    var imgGrp = null;
    try { imgGrp = imagesGroup.layerSets.getByName(subName); } catch(e) {}
    if (!imgGrp) continue;

    var imageLayers = imgGrp.artLayers;
    if (imageLayers.length < 2) continue;

    // --- FAZIS 0: Linkelés — Image + Names + Positions osszekapcsolasa ---
    _linkLayersForGroup(subName);

    // --- FAZIS 1: Images layer STACK sorrend csere ---
    var matchedLayers = [];
    var nameToLayer = {};
    for (var li = 0; li < imageLayers.length; li++) {
      nameToLayer[imageLayers[li].name] = imageLayers[li];
    }
    for (var oi = 0; oi < _orderedNames.length; oi++) {
      var layer = nameToLayer[_orderedNames[oi]];
      if (layer) matchedLayers.push(layer);
    }

    if (matchedLayers.length < 2) continue;

    // Production minta: reverse + moveLayersToBottomInGroup
    moveLayersToBottomInGroup(imgGrp, matchedLayers.reverse());

    // --- FAZIS 2: Fizikai poziciok atrendezese ---
    // A linkeles miatt a Names + Positions layerek automatikusan kovetik a kepeket
    rearrangeGroupLayersAndPositions(imgGrp);

    totalReordered += matchedLayers.length;
  }

  _reorderResult = '{"reordered":' + totalReordered + '}';
}

// ========== ENTRY POINT ==========

var __result = (function () {
  try {
    if (app.documents.length === 0) return '{"reordered":0}';
    _doc = app.activeDocument;

    var orderedNamesStr = typeof CONFIG !== "undefined" && CONFIG.ORDERED_NAMES ? CONFIG.ORDERED_NAMES : "";
    if (!orderedNamesStr) return '{"reordered":0,"error":"No ORDERED_NAMES"}';

    _orderedNames = parseJsonArray(orderedNamesStr);
    if (_orderedNames.length === 0) return '{"reordered":0}';

    _groupFilter = typeof CONFIG !== "undefined" && CONFIG.GROUP ? CONFIG.GROUP : "All";
    _reorderResult = '{"reordered":0}';

    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    _doc.suspendHistory("Layerek atrendezese", "_doReorderLayers()");

    app.preferences.rulerUnits = oldRulerUnits;
    return _reorderResult;

  } catch (e) {
    return '{"reordered":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();
__result;

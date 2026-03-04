/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan
 *
 * 1:1 a fotocms-admin.prod PRODUCTION logikaja:
 *   Fazis 1: moveLayersToBottomInGroup — CSAK Images layer STACK sorrend (Names-t NEM!)
 *   Fazis 2: rearrangeGroupLayersAndPositions — fizikai poziciok atrendezese
 *            (production: exact Y compare, nem threshold; translate sima szammal)
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

// ========== PRODUCTION: rearrangeGroupLayersAndPositions (organize-layers-by-current-position.jsx:35) ==========

function rearrangeGroupLayersAndPositions(imageLayerGroup) {
  var imageLayers = imageLayerGroup.artLayers;

  // 1. Slot poziciok kimentese — FORDÍTOTT sorrendben (production: i = length-1 .. 0)
  var layerPositions = [];
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var bounds = getLayerTransformedBounds(imageLayers[i]);
    layerPositions.push({ x: bounds.left, y: bounds.top });
  }

  // 2. Rendezzuk Y, majd X szerint (production: EXACT Y compare, nem threshold!)
  layerPositions.sort(function (a, b) {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  // 3. Reverse (production minta: layerPositions = layerPositions.reverse())
  layerPositions = layerPositions.reverse();

  // 4. Image layerek mozgatasa (production: moveLayerToPosition)
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

    // --- FAZIS 1: CSAK Images layer STACK sorrend csere ---
    // (production: Names-t NEM rendezzuk stack-ben! arrange-by-custom-order.jsx 40. sor kikommentelve)
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

    // --- FAZIS 2: Fizikai poziciok atrendezese (CSAK image layerek) ---
    // (production: a Names layerek poziciojat az updateNamesAndPositions kezeli kulon)
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

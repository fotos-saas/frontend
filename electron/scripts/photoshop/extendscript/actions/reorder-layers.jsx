/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan
 *
 * NEM LINKEL — minden csoport layereit kulon-kulon rendezi es mozgatja.
 * A regi production rendszer bevalt mintaja: explicit stack + pozicio csere.
 *
 * Lepesek csoportonkent (Students / Teachers):
 * 1. Slot poziciok kimentese az Images csoportbol (Y+X rendezett racs)
 * 2. MINDEN csoportban (Images, Names, Positions, barmilyen mas) ahol van azonos nevu layer:
 *    a) Stack sorrend csere (moveLayersToBottomInGroup)
 *    b) Fizikai pozicio mozgatas a kimentett slot-okba
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

// ========== Layer bounds ==========

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

function moveLayerToPosition(layer, x, y) {
  var bounds = getLayerTransformedBounds(layer);
  var deltaX = x - bounds.left;
  var deltaY = y - bounds.top;
  if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
    layer.translate(deltaX, deltaY);
  }
}

// ========== Stack sorrend csere ==========

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

// ========== Slot poziciok kimentese ==========
// Az image layerek aktualis pozicioibol epiti a racs-slot listát.
// Visszaad egy rendezett tomb-ot: [{x, y}, ...] — a kívánt sorrend pozíciói.

function _collectSlotPositions(imageLayers) {
  var positions = [];
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var bounds = getLayerTransformedBounds(imageLayers[i]);
    positions.push({ x: bounds.left, y: bounds.top });
  }

  // Y + X rendezés (ROW_THRESHOLD: 20px)
  var ROW_THRESHOLD = 20;
  positions.sort(function (a, b) {
    if (Math.abs(a.y - b.y) <= ROW_THRESHOLD) return a.x - b.x;
    return a.y - b.y;
  });

  // Reverse — a stack sorrend fordított a vizuális sorrendhez képest
  positions = positions.reverse();
  return positions;
}

// ========== Egy csoport layereinek rendezese + mozgatasa ==========
// A group-ban (pl. Names/Students) megkeresi az orderedNames-nek megfelelo layereket,
// stack sorrendbe rakja, majd a slotPositions-be mozgatja.

function _reorderGroupLayers(group, orderedNames, slotPositions) {
  if (!group) return;

  var artLayers = group.artLayers;
  if (artLayers.length === 0) return;

  // Name → layer map
  var nameToLayer = {};
  for (var i = 0; i < artLayers.length; i++) {
    nameToLayer[artLayers[i].name] = artLayers[i];
  }

  // Matched layers az ordered sorrend alapjan
  var matched = [];
  for (var j = 0; j < orderedNames.length; j++) {
    var layer = nameToLayer[orderedNames[j]];
    if (layer) matched.push(layer);
  }

  if (matched.length < 2) return;

  // 1. Stack sorrend csere
  var reversed = [];
  for (var r = matched.length - 1; r >= 0; r--) {
    reversed.push(matched[r]);
  }
  moveLayersToBottomInGroup(group, reversed);

  // 2. Fizikai pozicio mozgatas a slot poziciokba
  // Az artLayers ujraolvasasa a stack csere utan
  var freshLayers = group.artLayers;
  var layerCount = Math.min(freshLayers.length, slotPositions.length);
  for (var k = 0; k < layerCount; k++) {
    moveLayerToPosition(freshLayers[k], slotPositions[k].x, slotPositions[k].y);
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

    // --- 1. Images csoport rendezese ---
    var imgSlots = _collectSlotPositions(imageLayers);
    _reorderGroupLayers(imgGrp, _orderedNames, imgSlots);

    // --- 2. MINDEN top-level csoport ami tartalmaz subName alcsoportot ---
    // Vegigmegyunk az osszes csoporton (Names, Positions, sdss, barmilyen mas),
    // es ha van benne subName (Students/Teachers) alcsoport azonos nevu layerekkel,
    // azokat is rendezzuk a sajat slot pozicioikba.
    for (var tl = 0; tl < _doc.layerSets.length; tl++) {
      var topGroup = _doc.layerSets[tl];
      if (topGroup.name === "Images") continue; // mar kezeltuk

      var subGrp = null;
      try { subGrp = topGroup.layerSets.getByName(subName); } catch(e) {}
      if (!subGrp || subGrp.artLayers.length === 0) continue;

      // Ellenorizzuk hogy vannak-e azonos nevu layerek mint az Images-ben
      var hasMatch = false;
      for (var cm = 0; cm < subGrp.artLayers.length; cm++) {
        if (subGrp.artLayers[cm].name.indexOf("---") !== -1) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) continue;

      var grpSlots = _collectSlotPositions(subGrp.artLayers);
      _reorderGroupLayers(subGrp, _orderedNames, grpSlots);
    }

    totalReordered += imageLayers.length;
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

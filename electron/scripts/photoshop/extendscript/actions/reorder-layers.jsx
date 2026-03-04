/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan
 *
 * Teljes egeszeben a fotocms-admin.prod PRODUCTION logikajara epul:
 *   Fazis 1: moveLayersToBottomInGroup — layer STACK sorrend csere (Images + Names)
 *   Fazis 2: rearrangeGroupLayersAndPositions — fizikai poziciok atrendezese
 *            (slot poziciok Y->X sorrendben, image layerek az uj stack sorrend szerint)
 *   Fazis 3: Names layerek repozicionalasa az image layerek ala
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

// ========== PRODUCTION HELPERS (layer.jsx-bol) ==========

/** Layer bounds lekerese — ActionManager, effect nelkul, gyors */
function _getBounds(layerId) {
  selectLayerById(layerId);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);
  var bKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(bKey)) {
    b = desc.getObjectValue(bKey);
  } else {
    b = desc.getObjectValue(stringIDToTypeID("bounds"));
  }
  return {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
}

/** Layer mozgatasa adott X,Y pozicioba (production moveLayerToPosition minta) */
function _moveTo(layer, x, y) {
  var b = _getBounds(layer.id);
  var dx = x - b.left;
  var dy = y - b.top;
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    layer.translate(new UnitValue(Math.round(dx), "px"), new UnitValue(Math.round(dy), "px"));
  }
}

// ========== PRODUCTION: moveLayersToBottomInGroup ==========
// Temp group trukk — layer STACK sorrendet valtoztat, NEM fizikai poziciot!

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

// ========== PRODUCTION: rearrangeGroupLayersAndPositions ==========
// Slot poziciok kiszedese + fizikai mozgatas

function rearrangeGroupLayersAndPositions(imageLayerGroup, nameLayerGroup) {
  var imageLayers = imageLayerGroup.artLayers;

  // 1. Slot poziciok kimentese (FORDÍTOTT sorrendben jarjuk be — PS artLayers index)
  var layerPositions = [];
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var b = _getBounds(imageLayers[i].id);
    layerPositions.push({ x: b.left, y: b.top });
  }

  // 2. Rendezzuk Y (felulrol), majd X (balrol) szerint
  layerPositions.sort(function (a, b) {
    if (Math.abs(a.y - b.y) < 20) return a.x - b.x;
    return a.y - b.y;
  });

  // 3. Reverse — mert a PS artLayers[0] a legfelso (vizualisan utolso)
  layerPositions = layerPositions.reverse();

  // 4. Image layerek fizikai mozgatasa az uj poziciokba
  //    A Names layereket is mozgatjuk (ID matching alapjan)
  var nameLayers = nameLayerGroup ? nameLayerGroup.artLayers : null;

  for (var k = 0; k < Math.min(imageLayers.length, layerPositions.length); k++) {
    var imgLayer = imageLayers[k];
    var targetX = layerPositions[k].x;
    var targetY = layerPositions[k].y;

    // Image regi pozicio
    var oldB = _getBounds(imgLayer.id);
    var dx = targetX - oldB.left;
    var dy = targetY - oldB.top;

    // Image mozgatasa
    _moveTo(imgLayer, targetX, targetY);

    // Matching name layer mozgatasa UGYANAZZAL a deltaval
    if (nameLayers && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
      for (var n = 0; n < nameLayers.length; n++) {
        if (nameLayers[n].name === imgLayer.name) {
          nameLayers[n].translate(
            new UnitValue(Math.round(dx), "px"),
            new UnitValue(Math.round(dy), "px")
          );
          break;
        }
      }
    }
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
  var namesGroup = getGroupByPath(_doc, ["Names"]);
  if (!imagesGroup) { _reorderResult = '{"reordered":0,"error":"No Images group"}'; return; }

  // Melyik alcsoporto(ka)t rendezzuk
  var subGroups = [];
  if (_groupFilter === "All" || _groupFilter === "Students") subGroups.push("Students");
  if (_groupFilter === "All" || _groupFilter === "Teachers") subGroups.push("Teachers");

  var totalReordered = 0;

  for (var sg = 0; sg < subGroups.length; sg++) {
    var subName = subGroups[sg];
    var imgGrp = null;
    var nameGrp = null;

    try { imgGrp = imagesGroup.layerSets.getByName(subName); } catch(e) {}
    try { nameGrp = namesGroup ? namesGroup.layerSets.getByName(subName) : null; } catch(e) {}
    if (!imgGrp) continue;

    var imageLayers = imgGrp.artLayers;
    if (imageLayers.length < 2) continue;

    // --- FAZIS 1: Layer STACK sorrend csere (production arrangeByCustomOrder minta) ---
    // Megkeressuk az ORDERED_NAMES-hez tartozo image layereket
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

    // Names layerek STACK sorrendjét is atrendezzuk (parhuzamos)
    if (nameGrp) {
      var nameLayersArr = nameGrp.artLayers;
      var nameToNameLayer = {};
      for (var nli = 0; nli < nameLayersArr.length; nli++) {
        nameToNameLayer[nameLayersArr[nli].name] = nameLayersArr[nli];
      }
      var matchedNameLayers = [];
      for (var oni = 0; oni < _orderedNames.length; oni++) {
        var nl = nameToNameLayer[_orderedNames[oni]];
        if (nl) matchedNameLayers.push(nl);
      }
      if (matchedNameLayers.length > 1) {
        moveLayersToBottomInGroup(nameGrp, matchedNameLayers.reverse());
      }
    }

    // --- FAZIS 2: Fizikai poziciok atrendezese (production organizeLayersByCurrentPosition minta) ---
    rearrangeGroupLayersAndPositions(imgGrp, nameGrp);

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

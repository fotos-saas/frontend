/**
 * reorder-layers.jsx — Layer poziciok atrendezese megadott nevsorrendben
 *
 * Production (fotocms-admin.prod) mintajara epul:
 *   1. Slot poziciok kimentese (image layerek aktualis X,Y koordinatai, Y->X sorrendben)
 *   2. moveLayersToBottomInGroup — PS layer STACK SORREND atrendezese (nem fizikai mozgatas!)
 *   3. Fizikai poziciok atrendezese: az uj stack sorrend szerint az image layereket a slotokba mozgatja
 *   4. Names layereket KULON, ugyanazzal a deltaval mozgatja (nem linkelt!)
 *
 * Bemeneti JSON (CONFIG-ban):
 *   ORDERED_NAMES = JSON string tomb: ["slug1---123", "slug2---456", ...]
 *   GROUP = "Students" | "Teachers" | "All" (default: "All")
 *
 * Kimenet: JSON { "reordered": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var ROW_THRESHOLD = 20; // px — ezen belul azonos sor

var _doc, _orderedNames, _groupFilter, _reorderResult;

// --- Bounds lekerese effect nelkul (ActionManager, gyors) ---
function getBoundsNoEffects(layerId) {
  selectLayerById(layerId);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);
  var boundsKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
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

// --- Image layerek osszegyujtese egy csoportbol ---
function collectLayerInfos(doc, groupPath) {
  var grp = getGroupByPath(doc, groupPath);
  if (!grp) return [];
  var result = [];
  for (var i = 0; i < grp.artLayers.length; i++) {
    var layer = grp.artLayers[i];
    var b = getBoundsNoEffects(layer.id);
    result.push({
      layer: layer,
      layerId: layer.id,
      name: layer.name,
      x: b.left,
      y: b.top
    });
  }
  return result;
}

// --- Slot poziciok kiszedese (Y->X sorrend) ---
function getPositionSlots(layerInfos) {
  var sorted = layerInfos.slice(0);
  sorted.sort(function (a, b) { return a.y - b.y; });

  var rows = [];
  var currentRow = [];
  var currentRowY = -99999;

  for (var i = 0; i < sorted.length; i++) {
    var ly = sorted[i].y;
    if (currentRow.length === 0 || Math.abs(ly - currentRowY) <= ROW_THRESHOLD) {
      currentRow.push(sorted[i]);
      if (currentRow.length === 1) currentRowY = ly;
    } else {
      rows.push(currentRow);
      currentRow = [sorted[i]];
      currentRowY = ly;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  var slots = [];
  for (var r = 0; r < rows.length; r++) {
    rows[r].sort(function (a, b) { return a.x - b.x; });
    for (var c = 0; c < rows[r].length; c++) {
      slots.push({ x: rows[r][c].x, y: rows[r][c].y });
    }
  }
  return slots;
}

// --- Layer stack sorrend atrendezese csoporton belul (production minta) ---
// Temp group trukk: atrakja a layereket temp-be, majd PLACEATEND-del visszarakja
function moveLayersToBottomInGroup(group, layers) {
  var tempGroup = group.layerSets.add();
  tempGroup.name = "TempReorder";

  for (var i = 0; i < layers.length; i++) {
    layers[i].move(tempGroup, ElementPlacement.INSIDE);
  }

  // Fordított sorrendben visszarakjuk — igy az elso layer lesz "legfelul"
  for (var j = layers.length - 1; j >= 0; j--) {
    tempGroup.artLayers[j].move(group, ElementPlacement.PLACEATEND);
  }

  tempGroup.remove();
}

// --- Names layerek osszegyujtese nev alapjan ---
function collectNameLayerMap(doc) {
  var groups = [
    ["Names", "Students"],
    ["Names", "Teachers"]
  ];
  var map = {};
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      var layer = grp.artLayers[i];
      if (!map[layer.name]) map[layer.name] = [];
      map[layer.name].push(layer);
    }
  }
  return map;
}

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

// --- Fo logika ---
function _doReorderLayers() {
  // 1. Image layerek osszegyujtese
  var imgGroups = [];
  if (_groupFilter === "All" || _groupFilter === "Students") {
    imgGroups.push(["Images", "Students"]);
  }
  if (_groupFilter === "All" || _groupFilter === "Teachers") {
    imgGroups.push(["Images", "Teachers"]);
  }

  var allInfos = [];
  for (var g = 0; g < imgGroups.length; g++) {
    allInfos = allInfos.concat(collectLayerInfos(_doc, imgGroups[g]));
  }

  if (allInfos.length < 2) {
    _reorderResult = '{"reordered":0}';
    return;
  }

  // 2. Nev -> layerInfo mapping
  var nameToInfo = {};
  for (var i = 0; i < allInfos.length; i++) {
    if (allInfos[i].name && !nameToInfo[allInfos[i].name]) {
      nameToInfo[allInfos[i].name] = allInfos[i];
    }
  }

  // 3. Matchelt layerek kigyujtese (ORDERED_NAMES sorrendben)
  var matchedInfos = [];
  for (var k = 0; k < _orderedNames.length; k++) {
    if (nameToInfo[_orderedNames[k]]) {
      matchedInfos.push(nameToInfo[_orderedNames[k]]);
    }
  }

  if (matchedInfos.length < 2) {
    _reorderResult = '{"reordered":0,"error":"not enough matches, got ' + matchedInfos.length + '"}';
    return;
  }

  // 4. Slot poziciok kimentese (az EREDETI poziciokbol, MIELOTT barmi mozogna)
  var slots = getPositionSlots(matchedInfos);

  // 5. Layer STACK sorrend atrendezese csoportonkent
  //    (ez NEM mozgatja fizikailag a layereket, csak a PS panel sorrendjuket allitja)
  for (var gi = 0; gi < imgGroups.length; gi++) {
    var grp = getGroupByPath(_doc, imgGroups[gi]);
    if (!grp) continue;

    // Melyik ORDERED layerek vannak ebben a csoportban?
    var orderedInGroup = [];
    var otherInGroup = [];
    var existingNames = {};

    // Eloszor az ORDERED_NAMES sorrendben
    for (var oi = 0; oi < _orderedNames.length; oi++) {
      for (var li = 0; li < grp.artLayers.length; li++) {
        if (grp.artLayers[li].name === _orderedNames[oi] && !existingNames[_orderedNames[oi]]) {
          orderedInGroup.push(grp.artLayers[li]);
          existingNames[_orderedNames[oi]] = true;
          break;
        }
      }
    }

    // ORDERED_NAMES-ben nem szereplo layerek a vegere
    for (var xi = 0; xi < grp.artLayers.length; xi++) {
      if (!existingNames[grp.artLayers[xi].name]) {
        otherInGroup.push(grp.artLayers[xi]);
      }
    }

    var finalOrder = orderedInGroup.concat(otherInGroup);
    if (finalOrder.length > 1) {
      moveLayersToBottomInGroup(grp, finalOrder);
    }
  }

  // 6. Names layerek STACK sorrendjét is atrendezzuk (parhuzamos kezeleshez)
  var nameGroups = [];
  if (_groupFilter === "All" || _groupFilter === "Students") {
    nameGroups.push(["Names", "Students"]);
  }
  if (_groupFilter === "All" || _groupFilter === "Teachers") {
    nameGroups.push(["Names", "Teachers"]);
  }

  for (var ngi = 0; ngi < nameGroups.length; ngi++) {
    var ngrp = getGroupByPath(_doc, nameGroups[ngi]);
    if (!ngrp) continue;

    var orderedNameLayers = [];
    var otherNameLayers = [];
    var usedNameLayers = {};

    for (var oni = 0; oni < _orderedNames.length; oni++) {
      for (var nli = 0; nli < ngrp.artLayers.length; nli++) {
        if (ngrp.artLayers[nli].name === _orderedNames[oni] && !usedNameLayers[_orderedNames[oni]]) {
          orderedNameLayers.push(ngrp.artLayers[nli]);
          usedNameLayers[_orderedNames[oni]] = true;
          break;
        }
      }
    }

    for (var xni = 0; xni < ngrp.artLayers.length; xni++) {
      if (!usedNameLayers[ngrp.artLayers[xni].name]) {
        otherNameLayers.push(ngrp.artLayers[xni]);
      }
    }

    var finalNameOrder = orderedNameLayers.concat(otherNameLayers);
    if (finalNameOrder.length > 1) {
      moveLayersToBottomInGroup(ngrp, finalNameOrder);
    }
  }

  // 7. Fizikai poziciok atrendezese
  //    Most mar a stack sorrend megegyezik az ORDERED_NAMES sorrenddel.
  //    Az image layereket (uj stack sorrendben) a slot poziciokba mozgatjuk.
  //    A Name layereket UGYANAZZAL a deltaval mozgatjuk.
  var nameLayerMap = collectNameLayerMap(_doc);

  // Ujra begyujtjuk az image layereket (stack sorrend mar atrendezve!)
  var freshInfos = [];
  for (var fg = 0; fg < imgGroups.length; fg++) {
    freshInfos = freshInfos.concat(collectLayerInfos(_doc, imgGroups[fg]));
  }

  // Slot index — a freshInfos-t a stack sorrendben kapjuk, a slots-t Y->X sorrendben
  // A stack sorrend mar ORDERED_NAMES szerinti, tehat freshInfos[0] = elso rendezett layer
  var reordered = 0;
  var slotIdx = 0;
  for (var fi = 0; fi < freshInfos.length && slotIdx < slots.length; fi++) {
    var info = freshInfos[fi];
    var slot = slots[slotIdx];

    // Friss pozicio lekerese
    var curB = getBoundsNoEffects(info.layerId);
    var dx = slot.x - curB.left;
    var dy = slot.y - curB.top;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      // Image layer mozgatasa
      selectLayerById(info.layerId);
      _doc.activeLayer.translate(
        new UnitValue(Math.round(dx), "px"),
        new UnitValue(Math.round(dy), "px")
      );

      // Names layer(ek) mozgatasa UGYANAZZAL a deltaval
      var nameSiblings = nameLayerMap[info.name];
      if (nameSiblings) {
        for (var ns = 0; ns < nameSiblings.length; ns++) {
          nameSiblings[ns].translate(
            new UnitValue(Math.round(dx), "px"),
            new UnitValue(Math.round(dy), "px")
          );
        }
      }
    }

    slotIdx++;
    reordered++;
  }

  _reorderResult = '{"reordered":' + reordered + '}';
}

// --- Entry point ---
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

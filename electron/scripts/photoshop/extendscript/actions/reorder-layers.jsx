/**
 * reorder-layers.jsx — Layer poziciok atrendezese megadott nevsorrendben
 *
 * Bemeneti JSON (CONFIG-ban):
 *   ORDERED_NAMES = JSON string tomb: ["Nev1", "Nev2", "Nev3", ...]
 *   GROUP = "Students" | "Teachers" | "All" (default: "All")
 *
 * Mukodese (production minta alapjan):
 *   1. Kiszedi az Images/Students es/vagy Images/Teachers layerek pozicioit (slot-ok)
 *   2. A slot-okat sor-oszlop sorrendbe rendezi (Y->X)
 *   3. Az ORDERED_NAMES alapjan az image layereket a slot poziciokba mozgatja
 *   4. A Names layereket KULON mozgatja ugyanazzal a deltaval (nem linkelt!)
 *   5. Az egesz muvelet egyetlen history lepes (suspendHistory)
 *
 * Kimenet: JSON { "reordered": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var ROW_THRESHOLD = 20; // px

// --- Globalis valtozok (suspendHistory string-eval miatt) ---
var _doc, _orderedNames, _groupFilter, _reorderResult;

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

function collectLayers(doc, groupPath) {
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
      y: b.top,
      w: b.right - b.left,
      h: b.bottom - b.top
    });
  }
  return result;
}

/** Names csoportbol az azonos nevu layereket gyujti ki */
function collectNameLayers(doc) {
  var groups = [
    ["Names", "Students"],
    ["Names", "Teachers"]
  ];
  var nameMap = {};
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      var layer = grp.artLayers[i];
      var name = layer.name;
      if (!nameMap[name]) nameMap[name] = [];
      nameMap[name].push({ layerId: layer.id, layer: layer });
    }
  }
  return nameMap;
}

function getPositionSlots(layers) {
  var sorted = layers.slice(0);
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

function moveLayerTo(layerId, targetX, targetY) {
  selectLayerById(layerId);
  var b = getBoundsNoEffects(layerId);
  var dx = targetX - b.left;
  var dy = targetY - b.top;
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    app.activeDocument.activeLayer.translate(
      new UnitValue(Math.round(dx), "px"),
      new UnitValue(Math.round(dy), "px")
    );
  }
  return { dx: dx, dy: dy };
}

function moveLayerByDelta(layerId, dx, dy) {
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
  selectLayerById(layerId);
  app.activeDocument.activeLayer.translate(
    new UnitValue(Math.round(dx), "px"),
    new UnitValue(Math.round(dy), "px")
  );
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

// --- Fo reorder logika (suspendHistory-bol hivva) ---
function _doReorderLayers() {
  // 1. Image layerek osszegyujtese a scope alapjan
  var allLayers = [];
  if (_groupFilter === "All" || _groupFilter === "Students") {
    allLayers = allLayers.concat(collectLayers(_doc, ["Images", "Students"]));
  }
  if (_groupFilter === "All" || _groupFilter === "Teachers") {
    allLayers = allLayers.concat(collectLayers(_doc, ["Images", "Teachers"]));
  }

  if (allLayers.length < 2) {
    _reorderResult = '{"reordered":0}';
    return;
  }

  // 2. Name layerek osszegyujtese (kulon kezeljuk, nem linkelt!)
  var nameLayers = collectNameLayers(_doc);

  // 3. Nev -> layer mapping
  var nameToLayer = {};
  for (var i = 0; i < allLayers.length; i++) {
    var n = allLayers[i].name;
    if (n && !nameToLayer[n]) {
      nameToLayer[n] = allLayers[i];
    }
  }

  // 4. Csak a matchelt layerekbol szedunk slot-okat
  var involvedLayers = [];
  for (var k = 0; k < _orderedNames.length; k++) {
    if (nameToLayer[_orderedNames[k]]) {
      involvedLayers.push(nameToLayer[_orderedNames[k]]);
    }
  }

  if (involvedLayers.length < 2) {
    _reorderResult = '{"reordered":0,"error":"not enough matches"}';
    return;
  }

  // 5. Slot poziciok kiszedese (Y->X sorrend)
  var slots = getPositionSlots(involvedLayers);

  // 6. Melyik layernek hova kell mennie
  var moves = [];
  for (var j = 0; j < Math.min(_orderedNames.length, slots.length); j++) {
    var layerInfo = nameToLayer[_orderedNames[j]];
    if (!layerInfo) continue;
    moves.push({
      layerId: layerInfo.layerId,
      name: layerInfo.name,
      fromX: layerInfo.x,
      fromY: layerInfo.y,
      targetX: slots[j].x,
      targetY: slots[j].y
    });
  }

  // 7. Eloszor MINDEN image layer eredeti poziciojat elmentjuk
  //    (mert a mozgatas kozben valtoznak a poziciok)
  var savedPositions = {};
  for (var sp = 0; sp < moves.length; sp++) {
    var spb = getBoundsNoEffects(moves[sp].layerId);
    savedPositions[moves[sp].layerId] = { x: spb.left, y: spb.top };
  }

  // 8. Image layerek mozgatasa a cel slot-okba
  //    A Names layereket KULON mozgatjuk ugyanazzal a deltaval
  var reordered = 0;
  for (var m = 0; m < moves.length; m++) {
    // Friss pozicio lekerese (korabbi mozgatasok utan valtozhatott)
    var curBounds = getBoundsNoEffects(moves[m].layerId);
    var dx = moves[m].targetX - curBounds.left;
    var dy = moves[m].targetY - curBounds.top;

    // Image layer mozgatasa
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      moveLayerByDelta(moves[m].layerId, dx, dy);

      // Names layerek mozgatasa UGYANAZZAL a deltaval (KULON, nem linkelt!)
      var nameGroup = nameLayers[moves[m].name];
      if (nameGroup) {
        for (var nl = 0; nl < nameGroup.length; nl++) {
          moveLayerByDelta(nameGroup[nl].layerId, dx, dy);
        }
      }
    }

    reordered++;
  }

  _reorderResult = '{"reordered":' + reordered + '}';
}

// --- Entry point ---
var __result = (function () {
  try {
    if (app.documents.length === 0) {
      return '{"reordered":0}';
    }
    _doc = app.activeDocument;

    var orderedNamesStr = typeof CONFIG !== "undefined" && CONFIG.ORDERED_NAMES ? CONFIG.ORDERED_NAMES : "";
    if (!orderedNamesStr) {
      return '{"reordered":0,"error":"No ORDERED_NAMES"}';
    }

    _orderedNames = parseJsonArray(orderedNamesStr);
    if (_orderedNames.length === 0) {
      return '{"reordered":0}';
    }

    _groupFilter = typeof CONFIG !== "undefined" && CONFIG.GROUP ? CONFIG.GROUP : "All";
    _reorderResult = '{"reordered":0}';

    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Egyetlen history lepes — Ctrl+Z-vel visszavonhato
    _doc.suspendHistory("Layerek atrendezese", "_doReorderLayers()");

    app.preferences.rulerUnits = oldRulerUnits;
    return _reorderResult;

  } catch (e) {
    return '{"reordered":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();
__result;

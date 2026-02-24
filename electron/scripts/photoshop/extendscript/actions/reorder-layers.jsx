/**
 * reorder-layers.jsx — Layer poziciok atrendezese megadott nevsorrendben
 *
 * Bemeneti JSON (CONFIG-ban):
 *   ORDERED_NAMES = JSON string tomb: ["Nev1", "Nev2", "Nev3", ...]
 *   GROUP = "Students" | "Teachers" | "All" (default: "All")
 *
 * Mukodese:
 *   1. Kiszedi az Images/Students es/vagy Images/Teachers layerek pozicioit (slot-ok)
 *   2. A slot-okat sor-oszlop sorrendbe rendezi (Y->X)
 *   3. Az ORDERED_NAMES alapjan a layereket a slot-okba mozgatja
 *      (ket menetes: eloszor off-screen parkol, aztan cel pozicioba tesz)
 *
 * Kimenet: JSON { "reordered": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var ROW_THRESHOLD = 20; // px

function getBoundsNoEffects(layerId) {
  var desc2 = new ActionDescriptor();
  var ref2 = new ActionReference();
  ref2.putIdentifier(charIDToTypeID("Lyr "), layerId);
  desc2.putReference(charIDToTypeID("null"), ref2);
  executeAction(charIDToTypeID("slct"), desc2, DialogModes.NO);

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

// Translate layer: aktualis bounds-bol szamolja a delta-t
function translateLayerTo(layerId, targetX, targetY) {
  // Kivalasztjuk a layert es kiolvasuk aktualis poziciot
  var desc2 = new ActionDescriptor();
  var ref2 = new ActionReference();
  ref2.putIdentifier(charIDToTypeID("Lyr "), layerId);
  desc2.putReference(charIDToTypeID("null"), ref2);
  executeAction(charIDToTypeID("slct"), desc2, DialogModes.NO);

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
  var curX = b.getUnitDoubleValue(stringIDToTypeID("left"));
  var curY = b.getUnitDoubleValue(stringIDToTypeID("top"));

  var dx = targetX - curX;
  var dy = targetY - curY;
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    // ActionManager translate — gyorsabb mint DOM translate
    var moveDesc = new ActionDescriptor();
    var posDesc = new ActionDescriptor();
    posDesc.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), Math.round(dx));
    posDesc.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), Math.round(dy));
    moveDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Ofst"), posDesc);
    executeAction(charIDToTypeID("move"), moveDesc, DialogModes.NO);
  }
}

// --- Egyszeru JSON tomb parser (ES3 — nincs JSON.parse) ---
// Csak string tombot kezel: ["aaa","bbb","ccc"]
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

var __result = (function () {
  try {
    if (app.documents.length === 0) {
      return '{"reordered":0}';
    }
    var doc = app.activeDocument;

    var orderedNamesStr = typeof CONFIG !== "undefined" && CONFIG.ORDERED_NAMES ? CONFIG.ORDERED_NAMES : "";
    if (!orderedNamesStr) {
      return '{"reordered":0,"error":"No ORDERED_NAMES"}';
    }

    var orderedNames = parseJsonArray(orderedNamesStr);
    if (orderedNames.length === 0) {
      return '{"reordered":0}';
    }

    var groupFilter = typeof CONFIG !== "undefined" && CONFIG.GROUP ? CONFIG.GROUP : "All";

    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Multi-select feloldasa — kivalasztunk EGYETLEN layert hogy ne legyen tobbszoros kijeleoles
    // Ez szukseges, mert a "Move" parancs nem mukodik multi-select eseten
    try {
      var deselRef = new ActionReference();
      deselRef.putIndex(charIDToTypeID("Lyr "), 1);
      var deselDesc = new ActionDescriptor();
      deselDesc.putReference(charIDToTypeID("null"), deselRef);
      deselDesc.putBoolean(charIDToTypeID("MkVs"), false);
      executeAction(charIDToTypeID("slct"), deselDesc, DialogModes.NO);
    } catch (deselErr) {
      // Ha nem sikerul, nem baj — folytatjuk
    }

    var allLayers = [];
    if (groupFilter === "All" || groupFilter === "Students") {
      allLayers = allLayers.concat(collectLayers(doc, ["Images", "Students"]));
    }
    if (groupFilter === "All" || groupFilter === "Teachers") {
      allLayers = allLayers.concat(collectLayers(doc, ["Images", "Teachers"]));
    }

    if (allLayers.length < 2) {
      app.preferences.rulerUnits = oldRulerUnits;
      return '{"reordered":0}';
    }

    // Nev -> layerInfo map
    var nameToLayer = {};
    var allLayerNamesList = [];
    for (var i = 0; i < allLayers.length; i++) {
      var n = allLayers[i].name;
      allLayerNamesList.push(n);
      if (n && !nameToLayer[n]) {
        nameToLayer[n] = allLayers[i];
      }
    }

    // Erintett layerek: ORDERED_NAMES-ben szereplo layerek
    var involvedLayers = [];
    var matchedNames = [];
    var unmatchedNames = [];
    for (var k = 0; k < orderedNames.length; k++) {
      if (nameToLayer[orderedNames[k]]) {
        involvedLayers.push(nameToLayer[orderedNames[k]]);
        matchedNames.push(orderedNames[k]);
      } else {
        unmatchedNames.push(orderedNames[k]);
      }
    }

    // Ha nincs eleg match, debug infoval terunk vissza
    if (involvedLayers.length < 2) {
      app.preferences.rulerUnits = oldRulerUnits;
      // Debug: miert nem egyezett? Elso 5 layer nev + elso 3 ordered name
      var dbgLayers = allLayerNamesList.slice(0, 5).join("|");
      var dbgOrdered = orderedNames.slice(0, 3).join("|");
      return '{"reordered":0,"debug":"layers:' + dbgLayers.replace(/"/g, '') + ' ordered:' + dbgOrdered.replace(/"/g, '') + ' unmatched:' + unmatchedNames.length + ' allCount:' + allLayers.length + '"}';
    }

    // Slot-ok: CSAK az erintett layerek jelenlegi pozicioit hasznaljuk
    var slots = getPositionSlots(involvedLayers);

    // Kiszamoljuk az OSSZES mozgatast elore (cel poziciok)
    var moves = []; // { layerId, targetX, targetY }
    for (var j = 0; j < Math.min(orderedNames.length, slots.length); j++) {
      var layerInfo = nameToLayer[orderedNames[j]];
      if (!layerInfo) continue;
      moves.push({
        layerId: layerInfo.layerId,
        targetX: slots[j].x,
        targetY: slots[j].y
      });
    }

    // 1. menet: OSSZES layert off-screen parkoloba (doc szelesseg + 10000px)
    var parkX = doc.width.as("px") + 10000;
    for (var m1 = 0; m1 < moves.length; m1++) {
      translateLayerTo(moves[m1].layerId, parkX + m1 * 500, 0);
    }

    // 2. menet: parkolobol cel pozicioba
    var reordered = 0;
    for (var m2 = 0; m2 < moves.length; m2++) {
      translateLayerTo(moves[m2].layerId, moves[m2].targetX, moves[m2].targetY);
      reordered++;
    }

    app.preferences.rulerUnits = oldRulerUnits;
    return '{"reordered":' + reordered + '}';

  } catch (e) {
    return '{"reordered":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();
__result;

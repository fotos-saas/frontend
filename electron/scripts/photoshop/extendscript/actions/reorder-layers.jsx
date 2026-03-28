/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan (v2)
 *
 * KONCEPCIÓ: A kep (Image) layer pozicioja a "slot" — minden mas layer
 * (nev, pozicio, Spotify kod, vonalkod, stb.) a kephez RELATIVAN mozog.
 *
 * Lepesek csoportonkent (Students / Teachers):
 * 1. Image slot poziciok kimentese (Y+X rendezett racs)
 * 2. MINDEN szemely MINDEN layeret UNLINKEL az egesz dokumentumban
 * 3. Szemelveneknt delta szamitas: uj slot - jelenlegi kep pozicio
 * 4. Ugyanaz a delta MINDEN azonos nevu layerre (kep, nev, pozicio, barmi)
 * 5. Stack sorrend csere az Images csoportban
 * 6. RELINK: szemelveneknt visszalinkel (azonos nevu layerek)
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

// ========== Layer bounds (effektek nelkul) ==========

function _getBounds(layer) {
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID('Lyr '), layer.id);
  var desc = executeActionGet(ref);

  var boundsKey = stringIDToTypeID('boundsNoEffects');
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
  } else {
    b = desc.getObjectValue(stringIDToTypeID('bounds'));
  }

  return {
    left: b.getUnitDoubleValue(stringIDToTypeID('left')),
    top: b.getUnitDoubleValue(stringIDToTypeID('top')),
    right: b.getUnitDoubleValue(stringIDToTypeID('right')),
    bottom: b.getUnitDoubleValue(stringIDToTypeID('bottom'))
  };
}

// ========== Rekurziv layer kereses nev alapjan ==========

function _findAllByNames(container, nameSet, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      var layer = container.artLayers[i];
      if (nameSet[layer.name]) {
        result.push(layer);
      }
    }
  } catch (e) { /* nincs artLayers */ }

  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _findAllByNames(container.layerSets[j], nameSet, result);
    }
  } catch (e) { /* nincs layerSets */ }
}

// ========== Tobb layer kijelolese ID alapjan (ActionManager) ==========

function _selectLayersById(layerIds) {
  selectMultipleLayersById(layerIds);
}

// ========== Linkeles / Unlinkeles ==========

function _unlinkLayers(layers) {
  var count = 0;
  for (var i = 0; i < layers.length; i++) {
    try { layers[i].unlink(); count++; } catch (e) { /* nem linkelt */ }
  }
  return count;
}

function _linkLayerGroup(layers) {
  if (layers.length < 2) return;
  var ids = [];
  for (var i = 0; i < layers.length; i++) {
    ids.push(layers[i].id);
  }
  _selectLayersById(ids);
  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

// ========== Slot poziciok kimentese ==========
// Az image layerek aktualis pozicioibol epiti a racs-slot listat.
// Visszaad: [{x, y, name, layer}, ...] — Y+X rendezve (vizualis sorrend)

function _collectImageSlots(imageLayers) {
  var items = [];
  // Az artLayers tomb fordított stack sorrendben van — alulrol felfelé
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var layer = imageLayers[i];
    var bounds = _getBounds(layer);
    items.push({ x: bounds.left, y: bounds.top, name: layer.name, layer: layer });
  }

  // Y + X rendezes (ROW_THRESHOLD: 20px)
  var ROW_THRESHOLD = 20;
  items.sort(function (a, b) {
    if (Math.abs(a.y - b.y) <= ROW_THRESHOLD) return a.x - b.x;
    return a.y - b.y;
  });

  return items;
}

// ========== Stack sorrend csere az Images csoportban ==========

function _reorderStack(group, orderedNames) {
  var artLayers = group.artLayers;
  if (artLayers.length < 2) return;

  // Name -> layer map
  var nameToLayer = {};
  for (var i = 0; i < artLayers.length; i++) {
    nameToLayer[artLayers[i].name] = artLayers[i];
  }

  // Fordított sorrendben a csoport TETEJÉRE rakjuk egyenként (DOM move — csoporton belül marad!)
  for (var m = orderedNames.length - 1; m >= 0; m--) {
    var layer = nameToLayer[orderedNames[m]];
    if (!layer) continue;
    try {
      layer.move(group, ElementPlacement.PLACEATBEGINNING);
    } catch (e) { /* skip ha nem sikerul */ }
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

    // --- 1. Image slot poziciok kimentese (jelenlegi vizualis sorrend) ---
    var slots = _collectImageSlots(imageLayers);

    // --- 2. orderedNames → jelenlegi Image layer poziciok map ---
    // Nev -> jelenlegi Image bounds (top-left)
    var nameToCurrentPos = {};
    for (var s = 0; s < slots.length; s++) {
      nameToCurrentPos[slots[s].name] = { x: slots[s].x, y: slots[s].y };
    }

    // --- 3. Kik azok az orderedNames akik tenyleg leteznek? ---
    var validNames = [];
    for (var v = 0; v < _orderedNames.length; v++) {
      if (nameToCurrentPos[_orderedNames[v]]) {
        validNames.push(_orderedNames[v]);
      }
    }
    if (validNames.length < 2) continue;

    // --- 4. nameSet felepitese az OSSZES megfelelo nevvel ---
    var nameSet = {};
    for (var n = 0; n < validNames.length; n++) {
      nameSet[validNames[n]] = true;
    }

    // --- 5. OSSZES layer megkeresese az egesz dokumentumban (azonos nevu) ---
    var allLayers = [];
    _findAllByNames(_doc, nameSet, allLayers);

    // --- 6. UNLINK: minden talaltra futtatjuk ---
    _unlinkLayers(allLayers);

    // --- 7. Delta szamitas es mozgatas ---
    // A slot-ok vizualis sorrendben vannak (Y->X) → validNames[i] → slots[i] pozicioba kell
    // Nev szerinti csoportositas (ES3: parhuzamos tombok)
    var layerGroupKeys = [];
    var layerGroupValues = [];
    for (var a = 0; a < allLayers.length; a++) {
      var lName = allLayers[a].name;
      var gIdx = -1;
      for (var gk = 0; gk < layerGroupKeys.length; gk++) {
        if (layerGroupKeys[gk] === lName) { gIdx = gk; break; }
      }
      if (gIdx === -1) {
        layerGroupKeys.push(lName);
        layerGroupValues.push([allLayers[a]]);
      } else {
        layerGroupValues[gIdx].push(allLayers[a]);
      }
    }

    // Nev→csoportindex lookup helper
    function _getGroupIndex(name) {
      for (var gi = 0; gi < layerGroupKeys.length; gi++) {
        if (layerGroupKeys[gi] === name) return gi;
      }
      return -1;
    }

    // validNames[i] → slots[i] pozicioba kell mozgatni
    for (var m = 0; m < validNames.length && m < slots.length; m++) {
      var personName = validNames[m];
      var targetSlot = slots[m];
      var currentPos = nameToCurrentPos[personName];

      // Delta: mennyivel kell eltolni az Image layert (es MINDEN testvert)
      var dx = targetSlot.x - currentPos.x;
      var dy = targetSlot.y - currentPos.y;

      // Ha nincs eltolas, skip
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      // Az osszes azonos nevu layert ugyanazzal a delta-val mozgatjuk
      var grpIdx = _getGroupIndex(personName);
      if (grpIdx === -1) continue;

      var siblings = layerGroupValues[grpIdx];
      for (var si = 0; si < siblings.length; si++) {
        try {
          siblings[si].translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
        } catch (te) {
          // Layer mozgatas sikertelen — skip
        }
      }
    }

    // --- 8. Stack sorrend csere az Images csoportban ---
    _reorderStack(imgGrp, validNames);

    // --- 9. RELINK: szemelveneknt visszalinkel ---
    for (var rl = 0; rl < layerGroupKeys.length; rl++) {
      _linkLayerGroup(layerGroupValues[rl]);
    }

    totalReordered += validNames.length;
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

    _doc.suspendHistory("Layerek atrendezese", "_doReorderLayers()");

    return _reorderResult;

  } catch (e) {
    return '{"reordered":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();
__result;

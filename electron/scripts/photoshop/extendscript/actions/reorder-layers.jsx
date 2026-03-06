/**
 * reorder-layers.jsx — Layer atrendezes ORDERED_NAMES sorrend alapjan
 *
 * Megkozelites (regi orderer.jsx mintajara):
 * 1. Teljes dokumentum bejaras → layerMap[name] = [layer1, layer2, ...]
 *    Igy MINDEN azonos nevu layer megtalalhato (kep, nev, pozicio, keret, stb.)
 * 2. Images stack sorrend csere (moveLayersToBottomInGroup)
 * 3. Minden szemely osszes layeret linkeles (nev alapjan, teljes dokubol)
 * 4. Image layerek fizikai pozicio csere → linkelt layerek automatikusan kovetik
 * 5. Linkeles feloldas (unlinkAll)
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
var _layerMap = {};

// ========== Teljes dokumentum bejaras — layerMap epites ==========
// Minden ArtLayer nevet osszegyujti: layerMap[name] = [layer, layer, ...]
// Igy egy nev (pl. "kiss_janos---42") MINDEN elofordulasa megtalalhato,
// fuggetlenul attol melyik csoportban van (Images, Names, Positions, Backgrounds, stb.)

function _buildLayerMap() {
  _layerMap = {};
  _collectAllLayers(_doc);
}

function _collectAllLayers(parent) {
  for (var i = 0; i < parent.layers.length; i++) {
    var layer = parent.layers[i];
    if (layer.typename === "ArtLayer") {
      var name = layer.name;
      if (!_layerMap[name]) {
        _layerMap[name] = [];
      }
      _layerMap[name].push(layer);
    } else if (layer.typename === "LayerSet") {
      _collectAllLayers(layer);
    }
  }
}

// ========== Layer kijeloles ID alapjan (ActionManager) ==========

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

// ========== Linkeles: nev alapjan MINDENT osszekapcsol a teljes dokubol ==========

function _linkAllLayersByName(layerName) {
  var layers = _layerMap[layerName];
  if (!layers || layers.length < 2) return;

  var ids = [];
  for (var i = 0; i < layers.length; i++) {
    ids.push(layers[i].id);
  }
  _selectMultipleLayersById(ids);

  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

// ========== Linkeles feloldas ==========

function _unlinkAllLayersByName(layerName) {
  var layers = _layerMap[layerName];
  if (!layers) return;
  for (var i = 0; i < layers.length; i++) {
    try { layers[i].unlink(); } catch(e) {}
  }
}

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
  layer.translate(deltaX, deltaY);
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

// ========== Fizikai poziciok atrendezese ==========
// Az image layereket a slot poziciokba mozgatja.
// A linkeles miatt MINDEN hozzatartozo layer (nev, pozicio, keret, stb.) kovet.

function _rearrangePositions(imageLayerGroup) {
  var imageLayers = imageLayerGroup.artLayers;

  // 1. Slot poziciok kimentese — FORDÍTOTT sorrendben
  var layerPositions = [];
  for (var i = imageLayers.length - 1; i >= 0; i--) {
    var bounds = getLayerTransformedBounds(imageLayers[i]);
    layerPositions.push({ x: bounds.left, y: bounds.top });
  }

  // 2. Rendezés Y, majd X szerint (ROW_THRESHOLD: 20px sor csoportositas)
  var ROW_THRESHOLD = 20;
  layerPositions.sort(function (a, b) {
    if (Math.abs(a.y - b.y) <= ROW_THRESHOLD) return a.x - b.x;
    return a.y - b.y;
  });

  // 3. Reverse
  layerPositions = layerPositions.reverse();

  // 4. Image layerek mozgatasa — linkelt layerek automatikusan kovetik
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

  // Teljes dokumentum layerMap epitese
  _buildLayerMap();

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

    // --- 1. Images layer STACK sorrend csere ---
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

    // Osszes nev osszegyujtese a linkeleshez
    var layerNames = [];
    for (var mn = 0; mn < matchedLayers.length; mn++) {
      layerNames.push(matchedLayers[mn].name);
    }

    moveLayersToBottomInGroup(imgGrp, matchedLayers.reverse());

    // --- 2. Linkeles: MINDEN szemely OSSZES layeret osszekotjuk ---
    // A stack atrendezes UTAN, mert layer.move() eltori a linkeket.
    // A teljes dokumentumbol keres (layerMap), nem csak Images/Names/Positions.
    for (var ln = 0; ln < layerNames.length; ln++) {
      _linkAllLayersByName(layerNames[ln]);
    }

    // --- 3. Fizikai poziciok atrendezese ---
    // A linkelt layerek (nev, pozicio, keret, stb.) automatikusan kovetik a kepet.
    _rearrangePositions(imgGrp);

    // --- 4. Linkeles feloldas ---
    for (var ul = 0; ul < layerNames.length; ul++) {
      _unlinkAllLayersByName(layerNames[ul]);
    }

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

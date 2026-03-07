/**
 * center-selected.jsx — Kijelolt kepek vizszintes kozepre igazitasa
 *
 * Mukodes:
 *   1. Kijelolt layerek → Images/ szures → bounds
 *   2. Unlink minden erintett layerrol
 *   3. CSAK a kepek (Images/) bounds-abol szamitja a csoport kozepet
 *   4. Dokumentum vizszintes kozepe - csoport kozepe = dx
 *   5. Link vissza (szemelye nkent: minden azonos nevu layer)
 *   6. Linkelt allapotban eltolas: kijeloli az OSSZES erintett layert es egyszer mozdít
 *
 * Kimenet: JSON { "mode": "center", "dx": 42, "count": 5 }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Kijelolt layerek ID + nev + parent group lekerdezese ---
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

      var parentName = "";
      try {
        var pRef = new ActionReference();
        pRef.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("parentLayerID"));
        pRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
        var pDesc = executeActionGet(pRef);
        var parentId = pDesc.getInteger(stringIDToTypeID("parentLayerID"));
        if (parentId > 0) {
          var gpRef = new ActionReference();
          gpRef.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Nm  "));
          gpRef.putIdentifier(charIDToTypeID("Lyr "), parentId);
          var gpDesc = executeActionGet(gpRef);
          parentName = gpDesc.getString(charIDToTypeID("Nm  "));
        }
      } catch (e2) {}

      layers.push({ id: layerId, name: layerName, parentGroup: parentName });
    }
  } catch (e) {}
  return layers;
}

// --- Bounds effektek nelkul ---
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

// --- Kep layer keresese Images/ csoportban ---
function findLayerInGroup(doc, groupPath, targetName) {
  var grp = getGroupByPath(doc, groupPath);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === targetName) return grp.artLayers[i];
  }
  return null;
}

function findImageLayerByName(doc, layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var found = findLayerInGroup(doc, groups[g], layerName);
    if (found) return found;
  }
  return null;
}

function filterImageLayers(doc, selected) {
  var result = [];
  var processed = {};
  for (var i = 0; i < selected.length; i++) {
    var n = selected[i].name;
    if (processed[n]) continue;
    var imgLayer = findImageLayerByName(doc, n);
    if (imgLayer && imgLayer.id === selected[i].id) {
      processed[n] = true;
      result.push({ id: imgLayer.id, name: n });
    }
  }
  return result;
}

// --- Rekurziv layer kereses nev alapjan ---
function findAllLayersByName(container, targetName, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === targetName) result.push(container.artLayers[i]);
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      findAllLayersByName(container.layerSets[j], targetName, result);
    }
  } catch (e) {}
}

// --- Unlink minden azonos nevu layert ---
function unlinkByName(doc, layerName) {
  var found = [];
  findAllLayersByName(doc, layerName, found);
  for (var i = 0; i < found.length; i++) {
    try { found[i].unlink(); } catch (e) {}
  }
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

// --- Link action ---
function linkSelectedLayers() {
  var linkDesc = new ActionDescriptor();
  var linkRef = new ActionReference();
  linkRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  linkDesc.putReference(charIDToTypeID("null"), linkRef);
  executeAction(stringIDToTypeID("linkSelectedLayers"), linkDesc, DialogModes.NO);
}

// --- Layer translate (dx, dy) ActionManager-rel ---
function translateLayer(layerId, dx, dy) {
  if (dx === 0 && dy === 0) return;
  selectLayerById(layerId);
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);
  var offset = new ActionDescriptor();
  offset.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), dx);
  offset.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), dy);
  desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Ofst"), offset);
  executeAction(charIDToTypeID("move"), desc, DialogModes.NO);
}

// --- Eredeti kijeloles visszaallitasa ---
function restoreSelection(selected) {
  if (selected.length === 0) return;
  var selDesc = new ActionDescriptor();
  var selRef = new ActionReference();
  selRef.putIdentifier(charIDToTypeID("Lyr "), selected[0].id);
  selDesc.putReference(charIDToTypeID("null"), selRef);
  executeAction(charIDToTypeID("slct"), selDesc, DialogModes.NO);
  for (var k = 1; k < selected.length; k++) {
    var addDesc = new ActionDescriptor();
    var addRef = new ActionReference();
    addRef.putIdentifier(charIDToTypeID("Lyr "), selected[k].id);
    addDesc.putReference(charIDToTypeID("null"), addRef);
    addDesc.putEnumerated(
      stringIDToTypeID("selectionModifier"),
      stringIDToTypeID("selectionModifierType"),
      stringIDToTypeID("addToSelection")
    );
    executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
  }
}

// Globalis eredmeny
var _centerResult = '{"error":"Nem futott le"}';

function doCenterSelected() {
  var doc = app.activeDocument;
  var oldRulerUnits = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  try {
    // 1. Kijelolt layerek
    var selected = getSelectedLayerInfo();
    if (selected.length < 1) {
      _centerResult = '{"error":"Legalabb 1 kepet jelolj ki"}';
      return;
    }

    // 2. Szures: csak Images/ csoportbeliek
    var imageLayers = filterImageLayers(doc, selected);
    if (imageLayers.length < 1) {
      _centerResult = '{"error":"Legalabb 1 Images csoportbeli layer kell"}';
      return;
    }

    // 3. Bounds lekeres CSAK kepekbol
    var groupLeft = Infinity;
    var groupRight = -Infinity;
    for (var i = 0; i < imageLayers.length; i++) {
      var b = getBoundsNoEffects(imageLayers[i].id);
      if (b.left < groupLeft) groupLeft = b.left;
      if (b.right > groupRight) groupRight = b.right;
    }
    var groupCenter = (groupLeft + groupRight) / 2;
    var docCenter = doc.width.as("px") / 2;
    var dx = Math.round(docCenter - groupCenter);

    if (dx === 0) {
      restoreSelection(selected);
      _centerResult = '{"mode":"center","dx":0,"count":' + imageLayers.length + ',"message":"Mar kozepen van"}';
      return;
    }

    // 4. Unlink minden erintett layerrol
    for (var u = 0; u < imageLayers.length; u++) {
      unlinkByName(doc, imageLayers[u].name);
    }

    // 5. Link vissza: szemelye nkent minden azonos nevu layer
    for (var ln = 0; ln < imageLayers.length; ln++) {
      var allSibs = [];
      findAllLayersByName(doc, imageLayers[ln].name, allSibs);
      if (allSibs.length >= 2) {
        var sibIds = [];
        for (var si = 0; si < allSibs.length; si++) {
          sibIds.push(allSibs[si].id);
        }
        selectLayersById(sibIds);
        linkSelectedLayers();
      }
    }

    // 6. Kijelolni az osszes erintett layert es egyszer eltolni
    var allIds = [];
    var namesDone = {};
    for (var al = 0; al < imageLayers.length; al++) {
      if (namesDone[imageLayers[al].name]) continue;
      namesDone[imageLayers[al].name] = true;
      var sibs2 = [];
      findAllLayersByName(doc, imageLayers[al].name, sibs2);
      for (var s2 = 0; s2 < sibs2.length; s2++) {
        allIds.push(sibs2[s2].id);
      }
    }

    // Kijeloles + eltolas
    selectLayersById(allIds);
    // Translate a kijeleltet (ActionManager)
    var moveDesc = new ActionDescriptor();
    var moveRef = new ActionReference();
    moveRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    moveDesc.putReference(charIDToTypeID("null"), moveRef);
    var moveOffset = new ActionDescriptor();
    moveOffset.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), dx);
    moveOffset.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
    moveDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Ofst"), moveOffset);
    executeAction(charIDToTypeID("move"), moveDesc, DialogModes.NO);

    // 7. Eredeti kijeloles visszaallitasa
    restoreSelection(selected);

    _centerResult = '{"mode":"center","dx":' + dx + ',"count":' + imageLayers.length + '}';

  } finally {
    app.preferences.rulerUnits = oldRulerUnits;
  }
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Kozepre igazitas", "doCenterSelected()");
  }
} catch (e) {
  _centerResult = '{"error":"' + e.message.replace(/"/g, '\\"') + '"}';
}

_centerResult;

/**
 * reposition-to-image.jsx — Kijelolt layerek visszahelyezese a gazda kep poziciojara
 *
 * A kijelolt layer nevebol kinyeri az ID-t (---42 suffix),
 * megkeresi az Images/ csoportban a megfelelo image layert,
 * es a kijelolt layert annak top-left poziciojara mozgatja.
 *
 * Kimenet: JSON { "moved": N }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Kijelolt layerek ID + nev lekerdezese (ActionManager) ---
function getSelectedLayerIds() {
  var layers = [];
  try {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("targetLayersIDs"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    var desc = executeActionGet(ref);
    var idList = desc.getList(stringIDToTypeID("targetLayersIDs"));

    for (var i = 0; i < idList.count; i++) {
      var layerId = idList.getReference(i).getIdentifier();

      // Nev lekerdezese
      var layerRef = new ActionReference();
      layerRef.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Nm  "));
      layerRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
      var layerDesc = executeActionGet(layerRef);
      var layerName = layerDesc.getString(charIDToTypeID("Nm  "));

      layers.push({ id: layerId, name: layerName });
    }
  } catch (e) {}
  return layers;
}

// --- Layer bounds EFFEKTEK NELKUL — SELECT NELKUL, ID alapjan ---
function getBoundsNoEffects(layerId) {
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("boundsNoEffects"));
  ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
  var desc = executeActionGet(ref);
  var boundsKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
  } else {
    var ref2 = new ActionReference();
    ref2.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("bounds"));
    ref2.putIdentifier(charIDToTypeID("Lyr "), layerId);
    var desc2 = executeActionGet(ref2);
    b = desc2.getObjectValue(stringIDToTypeID("bounds"));
  }
  return {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
}

// --- Layer kivalasztasa ID alapjan ---
function selectLayerById(layerId) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}

// --- getGroupByPath itt a utils.jsx-bol jon (#include) ---

// --- JSON escape (ES3) ---
function escapeJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

// Globalis eredmeny
var _repositionResult = '{"moved":0}';

function doReposition() {
  var doc = app.activeDocument;

  var selected = getSelectedLayerIds();
  if (selected.length === 0) {
    _repositionResult = '{"moved":0,"error":"Nincs kijelolt layer"}';
    return;
  }

  // 1. Images csoport nev→ID map (EGYETLEN bejaras)
  var imageNameToId = {};
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    try {
      for (var a = 0; a < grp.artLayers.length; a++) {
        imageNameToId[grp.artLayers[a].name] = grp.artLayers[a].id;
      }
    } catch (e) {}
  }

  var moved = 0;

  for (var i = 0; i < selected.length; i++) {
    var sel = selected[i];

    // Gazda image layer keresese map-bol (O(1))
    var imgId = imageNameToId[sel.name];
    if (!imgId) continue;

    // Gazda image bounds
    var targetBounds = getBoundsNoEffects(imgId);

    // Kijelolt layer: bounds + kind egyetlen AM hivassal
    var selBounds, isText = false;
    try {
      var lRef = new ActionReference();
      lRef.putIdentifier(charIDToTypeID("Lyr "), sel.id);
      var lDesc = executeActionGet(lRef);

      // Kind check
      var kindKey = stringIDToTypeID("layerKind");
      if (lDesc.hasKey(kindKey)) isText = (lDesc.getInteger(kindKey) === 3);

      // Bounds
      var bKey = stringIDToTypeID("boundsNoEffects");
      var b = lDesc.hasKey(bKey) ? lDesc.getObjectValue(bKey) : lDesc.getObjectValue(stringIDToTypeID("bounds"));
      selBounds = {
        left: b.getUnitDoubleValue(stringIDToTypeID("left")),
        top: b.getUnitDoubleValue(stringIDToTypeID("top"))
      };
    } catch (e) { continue; }

    if (isText) {
      try {
        selectLayerById(sel.id);
        var ti = doc.activeLayer.textItem;
        var posX = ti.position[0].as("px");
        var posY = ti.position[1].as("px");
        ti.position = [
          new UnitValue(Math.round(targetBounds.left + (posX - selBounds.left)), "px"),
          new UnitValue(Math.round(targetBounds.top + (posY - selBounds.top)), "px")
        ];
        moved++;
      } catch (e) {
        // Fallback: translate
        try {
          doc.activeLayer.translate(
            new UnitValue(targetBounds.left - selBounds.left, "px"),
            new UnitValue(targetBounds.top - selBounds.top, "px")
          );
          moved++;
        } catch (e2) {}
      }
    } else {
      // AM move — nincs selectLayerById, nincs Layers panel redraw
      try {
        var mvDx = targetBounds.left - selBounds.left;
        var mvDy = targetBounds.top - selBounds.top;
        if (Math.abs(mvDx) > 0.5 || Math.abs(mvDy) > 0.5) {
          var mvDesc = new ActionDescriptor();
          var mvRef = new ActionReference();
          mvRef.putIdentifier(charIDToTypeID("Lyr "), sel.id);
          mvDesc.putReference(charIDToTypeID("null"), mvRef);
          var mvOfs = new ActionDescriptor();
          mvOfs.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), mvDx);
          mvOfs.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), mvDy);
          mvDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Ofst"), mvOfs);
          executeAction(charIDToTypeID("move"), mvDesc, DialogModes.NO);
        }
        moved++;
      } catch (e) {}
    }
  }

  // Eredeti kijeloles visszaallitasa
  if (selected.length > 0) {
    var restoreIds = [];
    for (var k = 0; k < selected.length; k++) restoreIds.push(selected[k].id);
    selectMultipleLayersById(restoreIds);
  }

  _repositionResult = '{"moved":' + moved + '}';
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Visszahelyezes", "doReposition()");
  }
} catch (e) {
  _repositionResult = '{"moved":0,"error":"' + escapeJsonStr(e.message) + '"}';
}

_repositionResult;

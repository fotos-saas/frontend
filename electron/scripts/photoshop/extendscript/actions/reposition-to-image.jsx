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

// --- Csoport elerese eleresi ut alapjan ---
function getGroupByPath(doc, pathArray) {
  var current = doc;
  for (var i = 0; i < pathArray.length; i++) {
    var found = false;
    try {
      for (var j = 0; j < current.layerSets.length; j++) {
        if (current.layerSets[j].name === pathArray[i]) {
          current = current.layerSets[j];
          found = true;
          break;
        }
      }
    } catch (e) {}
    if (!found) return null;
  }
  return current;
}

// --- Image layer keresese nev alapjan (Images/Students + Images/Teachers) ---
function findImageLayerByName(doc, layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    try {
      for (var i = 0; i < grp.artLayers.length; i++) {
        if (grp.artLayers[i].name === layerName) {
          return grp.artLayers[i];
        }
      }
    } catch (e) {}
  }
  return null;
}

// --- ID kinyerese layer nevbol (pl. "nagy-janos---42" → "nagy-janos---42") ---
// Visszaadja a teljes layer nevet, ami az Images-ben keresheto
function extractLayerBaseName(name) {
  // A layer neve megegyezik az Images-beli layer nevevel
  // Pl: "nagy-janos---42" layerek a Names/Students es Images/Students csoportban is ugyanazt a nevet kapjak
  return name;
}

// --- Baseline offset meres text layerekhez ---
var _baselineOffset = null;

function measureBaselineOffset(doc) {
  var refLayer = doc.artLayers.add();
  refLayer.kind = LayerKind.TEXT;
  refLayer.name = "__ref_measure_repo__";
  var ti = refLayer.textItem;
  ti.contents = "Hg";
  ti.font = "ArialMT";
  ti.size = new UnitValue(12, "pt");
  ti.justification = Justification.LEFT;

  var posY = ti.position[1].as("px");
  var b = getBoundsNoEffects(refLayer.id);
  var offset = posY - b.top;

  refLayer.remove();
  return offset;
}

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

  var moved = 0;

  for (var i = 0; i < selected.length; i++) {
    var sel = selected[i];
    var layerName = sel.name;

    // Gazda image layer keresese — azonos nev
    var imgLayer = findImageLayerByName(doc, layerName);
    if (!imgLayer) continue;

    // Gazda image layer bounds
    var targetBounds = getBoundsNoEffects(imgLayer.id);
    var targetLeft = targetBounds.left;
    var targetTop = targetBounds.top;

    // Kijelolt layer kivalasztasa es bounds lekerdezese
    selectLayerById(sel.id);
    doc.activeLayer = doc.activeLayer; // refresh

    // Ellenorizzuk, hogy text layer-e
    var isText = false;
    try {
      var lRef = new ActionReference();
      lRef.putIdentifier(charIDToTypeID("Lyr "), sel.id);
      var lDesc = executeActionGet(lRef);
      var kindKey = stringIDToTypeID("layerKind");
      if (lDesc.hasKey(kindKey)) {
        // layerKind: 3 = text layer
        isText = (lDesc.getInteger(kindKey) === 3);
      }
    } catch (e) {}

    if (isText) {
      // Text layer: textItem.position alapu mozgatas (baseline kompenzacio)
      try {
        selectLayerById(sel.id);
        var textLayer = doc.activeLayer;
        var ti = textLayer.textItem;

        // Jelenlegi bounds
        var currentBounds = getBoundsNoEffects(sel.id);
        var currentLeft = currentBounds.left;
        var currentTop = currentBounds.top;

        // Baseline offset
        var currentPosX = ti.position[0].as("px");
        var currentPosY = ti.position[1].as("px");
        var offsetX = currentPosX - currentLeft;
        var offsetY = currentPosY - currentTop;

        // Uj position: target top-left + offset
        var newPosX = targetLeft + offsetX;
        var newPosY = targetTop + offsetY;

        ti.position = [new UnitValue(Math.round(newPosX), "px"), new UnitValue(Math.round(newPosY), "px")];
        moved++;
      } catch (e) {
        // Fallback: translate
        try {
          var fb = getBoundsNoEffects(sel.id);
          var layer = doc.activeLayer;
          layer.translate(
            new UnitValue(targetLeft - fb.left, "px"),
            new UnitValue(targetTop - fb.top, "px")
          );
          moved++;
        } catch (e2) {}
      }
    } else {
      // Nem text layer: translate
      var currentBounds2 = getBoundsNoEffects(sel.id);
      selectLayerById(sel.id);
      try {
        doc.activeLayer.translate(
          new UnitValue(targetLeft - currentBounds2.left, "px"),
          new UnitValue(targetTop - currentBounds2.top, "px")
        );
        moved++;
      } catch (e) {}
    }
  }

  // Eredeti kijeloles visszaallitasa
  if (selected.length > 0) {
    var restoreIds = [];
    for (var k = 0; k < selected.length; k++) {
      restoreIds.push(selected[k].id);
    }
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

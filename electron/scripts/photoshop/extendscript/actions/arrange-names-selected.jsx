/**
 * arrange-names-selected.jsx — Nev layerek pozicionalasa a kepek ala
 *
 * Ha vannak kijelolt layerek → csak azok nev-parjait rendezi.
 * Ha nincs kijeloles → az osszes nevet rendezi (Names/Students + Names/Teachers).
 *
 * CONFIG parameterei:
 *   CONFIG.TEXT_ALIGN = "left" | "center" | "right" (default: "center")
 *   CONFIG.NAME_GAP_PX = szam (default: kep szelesseg * 0.08)
 *   CONFIG.BREAK_AFTER = szam (default: 0 — nincs sortores)
 *
 * Kimenet: JSON { "arranged": 5 }
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

      // Nev lekerdezese
      var layerRef = new ActionReference();
      layerRef.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Nm  "));
      layerRef.putIdentifier(charIDToTypeID("Lyr "), layerId);
      var layerDesc = executeActionGet(layerRef);
      var layerName = layerDesc.getString(charIDToTypeID("Nm  "));

      // Szulo csoport nevenek lekerdezese (Images/Names megkulonboztetes)
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

// --- Ellenorzi, hogy a kijelolt layerek kozott van-e Images csoportbeli ---
function hasImageSelection(selected) {
  for (var i = 0; i < selected.length; i++) {
    if (selected[i].parentGroup === "Students" || selected[i].parentGroup === "Teachers") {
      // Meg kell nezni a nagyszulot is — de a parent "Students"/"Teachers" az Images VAGY Names alatt lehet
      // Egyszerubb: nezzuk meg, hogy a layer benne van-e az Images csoportban
      return true;
    }
  }
  return false;
}

// --- Szuri a kijelolt layereket: csak Images csoportbeliek neveit adja vissza ---
function getImageSelectionNames(doc, selected) {
  var names = [];
  var processed = {};
  for (var i = 0; i < selected.length; i++) {
    var n = selected[i].name;
    if (processed[n]) continue;
    // Ellenorizzuk, hogy tenyleg Images csoportban van-e
    var imgLayer = findImageLayerByName(doc, n);
    if (imgLayer && imgLayer.id === selected[i].id) {
      processed[n] = true;
      names.push(n);
    }
  }
  return names;
}

// --- Layer bounds EFFEKTEK NELKUL ---
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

// --- Layer keresese nev alapjan egy csoportban ---
function findLayerInGroup(doc, groupPath, targetName) {
  var grp = getGroupByPath(doc, groupPath);
  if (!grp) return null;
  for (var i = 0; i < grp.artLayers.length; i++) {
    if (grp.artLayers[i].name === targetName) {
      return grp.artLayers[i];
    }
  }
  return null;
}

// --- Kep layer keresese nev alapjan (Images/Students vagy Images/Teachers) ---
function findImageLayerByName(doc, layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var found = findLayerInGroup(doc, groups[g], layerName);
    if (found) return found;
  }
  return null;
}

// --- Nev layer keresese nev alapjan (Names/Students vagy Names/Teachers) ---
function findNameLayerByName(doc, layerName) {
  var groups = [["Names", "Students"], ["Names", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var found = findLayerInGroup(doc, groups[g], layerName);
    if (found) return found;
  }
  return null;
}

// --- Pozicio layer keresese nev alapjan (Positions/Students vagy Positions/Teachers) ---
function findPositionLayerByName(doc, layerName) {
  var groups = [["Positions", "Students"], ["Positions", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var found = findLayerInGroup(doc, groups[g], layerName);
    if (found) return found;
  }
  return null;
}

// --- Osszes nev layer osszegyujtese ---
function getAllNameLayers(doc) {
  var result = [];
  var groups = [["Names", "Students"], ["Names", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var grp = getGroupByPath(doc, groups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      result.push(grp.artLayers[i]);
    }
  }
  return result;
}

// --- Nev tordeles ---
function breakName(name, breakAfter) {
  if (breakAfter <= 0) return name;
  var words = name.split(" ");
  if (words.length < 2) return name;
  function isPrefix(w) { return w.replace(/\./g, "").length <= 2; }
  var realCount = 0;
  for (var c = 0; c < words.length; c++) {
    if (!isPrefix(words[c])) realCount++;
  }
  if (realCount < 3) return name;
  var hyphenIndex = -1;
  for (var h = 0; h < words.length; h++) {
    if (words[h].indexOf("-") !== -1) { hyphenIndex = h; break; }
  }
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(" ") + "\r" + words.slice(hyphenIndex + 1).join(" ");
  }
  var realWordCount = 0;
  var breakIndex = -1;
  for (var i = 0; i < words.length; i++) {
    if (!isPrefix(words[i])) realWordCount++;
    if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
  }
  if (breakIndex === -1) return name;
  return words.slice(0, breakIndex).join(" ") + "\r" + words.slice(breakIndex).join(" ");
}

// --- Rekurziv layer kereses nev alapjan (unlink-hez) ---
function findAllLayersByName(container, targetName, result) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (container.artLayers[i].name === targetName) {
        result.push(container.artLayers[i]);
      }
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
    try { found[i].unlink(); } catch (e) { /* nem linkelt */ }
  }
}

// --- Referencia: baseline offset (position.y - bounds.top) ---
// Adott font/merethez konstans — egyszer merjuk, minden nevnel hasznaljuk.
var _baselineOffsetSel = null;
var _baselineOffsetPosSel = null;

function measureBaselineOffset(doc) {
  var refLayer = doc.artLayers.add();
  refLayer.kind = LayerKind.TEXT;
  refLayer.name = "__ref_measure__";
  var ti = refLayer.textItem;
  ti.contents = "Hg";
  ti.font = typeof CONFIG !== "undefined" && CONFIG.FONT_NAME ? CONFIG.FONT_NAME : "ArialMT";
  ti.size = new UnitValue(typeof CONFIG !== "undefined" && CONFIG.FONT_SIZE ? CONFIG.FONT_SIZE : 12, "pt");
  ti.justification = Justification.LEFT;

  var posY = ti.position[1].as("px");
  var b = getBoundsNoEffects(refLayer.id);
  var offset = posY - b.top;

  refLayer.remove();
  return offset;
}

function measureBaselineOffsetForSize(doc, fontSize) {
  var refLayer = doc.artLayers.add();
  refLayer.kind = LayerKind.TEXT;
  refLayer.name = "__ref_measure_pos__";
  var ti = refLayer.textItem;
  ti.contents = "Hg";
  ti.font = typeof CONFIG !== "undefined" && CONFIG.FONT_NAME ? CONFIG.FONT_NAME : "ArialMT";
  ti.size = new UnitValue(fontSize, "pt");
  ti.justification = Justification.LEFT;

  var posY = ti.position[1].as("px");
  var b = getBoundsNoEffects(refLayer.id);
  var offset = posY - b.top;

  refLayer.remove();
  return offset;
}

// --- Pozicio layer pozicionalasa a nev ala ---
function positionPositionLayerUnderName(doc, posLayer, nameLayer, imageLayer, textAlign) {
  var nameBounds = getBoundsNoEffects(nameLayer.id);
  var nameBottom = nameBounds.bottom;

  // Gap cm → px
  var dpi = doc.resolution;
  var posGapCm = typeof CONFIG !== "undefined" && CONFIG.POSITION_GAP_CM ? CONFIG.POSITION_GAP_CM : 0.15;
  var posGapPx = Math.round((posGapCm / 2.54) * dpi);

  // Baseline offset meres (egyszer)
  var posFontSize = typeof CONFIG !== "undefined" && CONFIG.POSITION_FONT_SIZE ? CONFIG.POSITION_FONT_SIZE : 18;
  if (_baselineOffsetPosSel === null) {
    _baselineOffsetPosSel = measureBaselineOffsetForSize(doc, posFontSize);
  }

  var posBoundsTop = nameBottom + posGapPx;
  var posBaselineY = posBoundsTop + _baselineOffsetPosSel;

  // Vizszintes pozicio: a kep alapjan (ugyanugy mint a nevnel)
  var imgBounds = getBoundsNoEffects(imageLayer.id);
  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = (imgBounds.left + imgBounds.right) / 2;
  }

  // Justification igazitas
  selectLayerById(posLayer.id);
  doc.activeLayer = posLayer;
  try {
    var posTextItem = posLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      posTextItem.justification = alignMap[textAlign];
    }
    posTextItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(posBaselineY), "px")];
  } catch (e) {
    // nem text layer — skip
  }
}

// --- Nev pozicionalasa a kep ala ---
// textItem.position (baseline anchor) alapu pozicionalas:
// A baseline pont NEM fugg a szoveg tartalmatol, ezert az ekezetes
// es ekezetmentes nevek ugyanarra a vonalra kerulnek.
function positionNameUnderImage(doc, nameLayer, imageLayer, gapPx, textAlign, breakAfter) {
  var imgBounds = getBoundsNoEffects(imageLayer.id);
  var imgCenterX = (imgBounds.left + imgBounds.right) / 2;
  var imgBottom = imgBounds.bottom;

  // Ha nincs gap megadva, a kep szelessegenek 8%-a
  if (gapPx <= 0) {
    gapPx = Math.round((imgBounds.right - imgBounds.left) * 0.08);
  }

  // Baseline offset meres (egyszer)
  if (_baselineOffsetSel === null) {
    _baselineOffsetSel = measureBaselineOffset(doc);
  }

  // Nev layer kivalasztasa
  selectLayerById(nameLayer.id);
  doc.activeLayer = nameLayer;

  // Text igazitas + sortores
  try {
    var textItem = nameLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      textItem.justification = alignMap[textAlign];
    }
    var plainName = textItem.contents.replace(/[\r\n]/g, " ").replace(/  +/g, " ");
    var newText = breakName(plainName, breakAfter);
    if (textItem.contents !== newText) {
      textItem.contents = newText;
    }
  } catch (e) {
    return false;
  }

  // Vertikalis pozicio: bounds.top = imgBottom + gap → baseline = boundsTop + offset
  var desiredBoundsTop = imgBottom + gapPx;
  var desiredBaselineY = desiredBoundsTop + _baselineOffsetSel;

  // Vizszintes pozicio: a justification anchor pontja
  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = imgCenterX;
  }

  // Position beallitasa — a baseline anchor pont
  textItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(desiredBaselineY), "px")];
  return true;
}

(function () {
  try {
    if (app.documents.length === 0) {
      '{"arranged":0}';
      return;
    }
    var doc = app.activeDocument;

    var textAlign = typeof CONFIG !== "undefined" && CONFIG.TEXT_ALIGN ? CONFIG.TEXT_ALIGN : "center";
    var breakAfter = typeof CONFIG !== "undefined" && CONFIG.BREAK_AFTER ? parseInt(CONFIG.BREAK_AFTER, 10) : 0;

    // Gap: ha cm-ben kapjuk, konvertaljuk px-re; ha px-ben, hasznaljuk kozvetlenul
    var nameGapPx = 0;
    if (typeof CONFIG !== "undefined" && CONFIG.NAME_GAP_CM) {
      var dpi = doc.resolution;
      nameGapPx = Math.round((parseFloat(CONFIG.NAME_GAP_CM) / 2.54) * dpi);
    } else if (typeof CONFIG !== "undefined" && CONFIG.NAME_GAP_PX) {
      nameGapPx = parseInt(CONFIG.NAME_GAP_PX, 10);
    }

    // Ruler pixelre
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Kijelolt layerek
    var selected = getSelectedLayerInfo();

    var nameLayers = [];

    // Csak ha Images csoportbeli layer van kijelolve → szukites
    // Egyebkent (nincs kijeloles VAGY nem Images layer) → mindenkit rendez
    var imageNames = (selected.length > 0) ? getImageSelectionNames(doc, selected) : [];

    if (imageNames.length > 0) {
      // Csak a kijelolt kepek nevparjait rendezzuk
      for (var i = 0; i < imageNames.length; i++) {
        var nameLayer = findNameLayerByName(doc, imageNames[i]);
        if (nameLayer) {
          nameLayers.push(nameLayer);
        }
      }
    } else {
      // Nincs Images kijeloles → osszes nev layer
      nameLayers = getAllNameLayers(doc);
    }

    var arranged = 0;
    for (var j = 0; j < nameLayers.length; j++) {
      var nl = nameLayers[j];
      var imgLayer = findImageLayerByName(doc, nl.name);
      if (!imgLayer) continue;

      // Unlink a rendezés elott (hogy szabadon mozgatható legyen)
      unlinkByName(doc, nl.name);

      if (positionNameUnderImage(doc, nl, imgLayer, nameGapPx, textAlign, breakAfter)) {
        arranged++;

        // Pozicio (beosztás) layer mozgatasa a nev ala
        var posLayer = findPositionLayerByName(doc, nl.name);
        if (posLayer) {
          positionPositionLayerUnderName(doc, posLayer, nl, imgLayer, textAlign);
        }
      }
    }

    // Eredeti kijeloles visszaallitasa
    if (selected.length > 0) {
      var selIds = [];
      for (var s = 0; s < selected.length; s++) {
        selIds.push(selected[s].id);
      }
      // Elso layer kivalasztasa
      var selDesc = new ActionDescriptor();
      var selRef = new ActionReference();
      selRef.putIdentifier(charIDToTypeID("Lyr "), selIds[0]);
      selDesc.putReference(charIDToTypeID("null"), selRef);
      executeAction(charIDToTypeID("slct"), selDesc, DialogModes.NO);
      // Tobbi hozzaadasa
      for (var k = 1; k < selIds.length; k++) {
        var addDesc = new ActionDescriptor();
        var addRef = new ActionReference();
        addRef.putIdentifier(charIDToTypeID("Lyr "), selIds[k]);
        addDesc.putReference(charIDToTypeID("null"), addRef);
        addDesc.putEnumerated(
          stringIDToTypeID("selectionModifier"),
          stringIDToTypeID("selectionModifierType"),
          stringIDToTypeID("addToSelection")
        );
        executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
      }
    }

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    '{"arranged":' + arranged + '}';

  } catch (e) {
    '{"arranged":0,"error":"' + e.message.replace(/"/g, '\\"') + '"}';
  }
})();

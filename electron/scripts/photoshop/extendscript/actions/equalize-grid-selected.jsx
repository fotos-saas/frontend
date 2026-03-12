/**
 * equalize-grid-selected.jsx — Kijelolt kepek egyenletes elosztasa
 *
 * Ket mod:
 *   1. MERES: GAP_H_PX ures → atlagos gap szamitasa, JSON return
 *   2. VEGREHAJTAS: GAP_H_PX megadva → kepek + nev/pozicio layerek mozgatasa
 *
 * CONFIG parameterek:
 *   CONFIG.GAP_H_PX       — vizszintes gap (px), ha ures = meresi mod
 *   CONFIG.ALIGN_TOP       — "true" / "false" — felso el igazitas
 *   CONFIG.ALIGN_TOP_ONLY  — "true" → CSAK felso el igazitas, gap nelkul
 *   CONFIG.GRID_COLS       — oszlopszam (ha megvan, grid mod)
 *   CONFIG.GRID_GAP_H_PX   — vizszintes gap pixelben (grid mod)
 *   CONFIG.GRID_GAP_V_PX   — fuggoleges gap pixelben (grid mod)
 *   CONFIG.GRID_ALIGN      — "left" / "center" / "right" (soron beluli igazitas)
 *   CONFIG.IMAGES_ONLY     — "true" → CSAK a kep layert mozgatja, testverlayerek maradnak
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

      // Szulo csoport neve
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

// --- Kep layer keresese Images/ csoportban ---
function findImageLayerByName(doc, layerName) {
  var groups = [["Images", "Students"], ["Images", "Teachers"]];
  for (var g = 0; g < groups.length; g++) {
    var found = findLayerInGroup(doc, groups[g], layerName);
    if (found) return found;
  }
  return null;
}

// --- Image layer szures: csak Images/ csoportbeliek ---
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
    try { found[i].unlink(); } catch (e) {}
  }
}

// --- Batch unlink: tomb minden elemenek nevere ---
function unlinkAll(doc, items) {
  for (var i = 0; i < items.length; i++) {
    unlinkByName(doc, items[i].name);
  }
}

// --- Batch relink: szemelveneknt visszalinkel ---
function relinkAll(doc, items) {
  for (var i = 0; i < items.length; i++) {
    var sibs = [];
    findAllLayersByName(doc, items[i].name, sibs);
    if (sibs.length >= 2) {
      var ids = [];
      for (var j = 0; j < sibs.length; j++) ids.push(sibs[j].id);
      selectLayersById(ids);
      linkSelectedLayers();
    }
  }
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

// --- Buborekrendezes left coord alapjan ---
function sortByLeft(items) {
  for (var i = 0; i < items.length - 1; i++) {
    for (var j = i + 1; j < items.length; j++) {
      if (items[j].bounds.left < items[i].bounds.left) {
        var tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
      }
    }
  }
  return items;
}

// --- Rendezes top majd left alapjan (soronkent, azon belul balrol jobbra) ---
function sortByTopLeft(items) {
  // Elso pass: meghatarozza a sorok kuszoberteket (felmeret tolerancia)
  // Ha ket kep top erteke kozel van (< fele magassag), ugyanabban a sorban vannak
  var rowThreshold = 10;
  if (items.length > 0) {
    rowThreshold = (items[0].bounds.bottom - items[0].bounds.top) / 2;
  }
  for (var i = 0; i < items.length - 1; i++) {
    for (var j = i + 1; j < items.length; j++) {
      var topDiff = items[j].bounds.top - items[i].bounds.top;
      var sameRow = (topDiff > -rowThreshold && topDiff < rowThreshold);
      if (!sameRow && items[j].bounds.top < items[i].bounds.top) {
        var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
      } else if (sameRow && items[j].bounds.left < items[i].bounds.left) {
        var tmp2 = items[i]; items[i] = items[j]; items[j] = tmp2;
      }
    }
  }
  return items;
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
var _eqResult = '{"error":"Nem futott le"}';

function doEqualizeGrid() {
  var doc = app.activeDocument;
  var oldRulerUnits = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  try {
  // Kijelolt layerek
  var selected = getSelectedLayerInfo();
  if (selected.length < 2) {
    _eqResult = '{"error":"Legalabb 2 kepet jelolj ki"}';
    return;
  }

  // Szures: csak Images/ csoportbeliek
  var imageLayers = filterImageLayers(doc, selected);
  if (imageLayers.length < 2) {
    _eqResult = '{"error":"Legalabb 2 Images csoportbeli layer kell"}';
    return;
  }

  // Bounds lekeres + left szerinti rendezes
  var items = [];
  for (var i = 0; i < imageLayers.length; i++) {
    var b = getBoundsNoEffects(imageLayers[i].id);
    items.push({ id: imageLayers[i].id, name: imageLayers[i].name, bounds: b });
  }
  items = sortByLeft(items);

  // CONFIG parameterek
  var gapHPxStr = typeof CONFIG !== "undefined" && CONFIG.GAP_H_PX ? CONFIG.GAP_H_PX : "";
  var alignTop = typeof CONFIG !== "undefined" && CONFIG.ALIGN_TOP === "true";
  var alignTopOnly = typeof CONFIG !== "undefined" && CONFIG.ALIGN_TOP_ONLY === "true";
  var gridColsStr = typeof CONFIG !== "undefined" && CONFIG.GRID_COLS ? CONFIG.GRID_COLS : "";
  var imagesOnly = typeof CONFIG !== "undefined" && CONFIG.IMAGES_ONLY === "true";

  // --- GRID MOD: racsba rendezes ---
  if (gridColsStr !== "") {
    // Grid modhoz top+left rendezes (soronkent, azon belul balrol jobbra)
    items = sortByTopLeft(items);
    var gridCols = parseInt(gridColsStr, 10);
    if (isNaN(gridCols) || gridCols < 1) gridCols = 1;
    var gridGapH = typeof CONFIG !== "undefined" && CONFIG.GRID_GAP_H_PX ? parseInt(CONFIG.GRID_GAP_H_PX, 10) : 0;
    var gridGapV = typeof CONFIG !== "undefined" && CONFIG.GRID_GAP_V_PX ? parseInt(CONFIG.GRID_GAP_V_PX, 10) : 0;
    var gridAlign = typeof CONFIG !== "undefined" && CONFIG.GRID_ALIGN ? CONFIG.GRID_ALIGN : "left";
    var gridRowsStr = typeof CONFIG !== "undefined" && CONFIG.GRID_ROWS ? CONFIG.GRID_ROWS : "";
    var gridMaxRows = gridRowsStr !== "" ? parseInt(gridRowsStr, 10) : 0;
    if (isNaN(gridGapH)) gridGapH = 0;
    if (isNaN(gridGapV)) gridGapV = 0;
    if (isNaN(gridMaxRows) || gridMaxRows < 0) gridMaxRows = 0;

    // Ha sorok megadva, csak annyi kepet rendezunk
    var maxItems = gridMaxRows > 0 ? Math.min(items.length, gridCols * gridMaxRows) : items.length;

    // Unlink hogy a mozgatas izolalt legyen
    unlinkAll(doc, items);

    // 3. Grid pozicio szamitas es eltolas
    var startLeft = items[0].bounds.left;
    var startTop = items[0].bounds.top;
    var photoW = items[0].bounds.right - items[0].bounds.left;
    var photoH = items[0].bounds.bottom - items[0].bounds.top;

    var totalRows = Math.ceil(maxItems / gridCols);
    var placed = 0;

    for (var gi = 0; gi < maxItems; gi++) {
      var col = gi % gridCols;
      var row = Math.floor(gi / gridCols);
      var targetLeft = startLeft + col * (photoW + gridGapH);
      var targetTop = startTop + row * (photoH + gridGapV);

      // Utolso (nem teli) sor igazitasa
      var isLastRow = (row === totalRows - 1);
      var itemsInLastRow = maxItems - row * gridCols;
      if (isLastRow && itemsInLastRow < gridCols && gridAlign !== "left") {
        var totalRowWidth = itemsInLastRow * photoW + (itemsInLastRow - 1) * gridGapH;
        var fullRowWidth = gridCols * photoW + (gridCols - 1) * gridGapH;
        var offsetX = 0;
        if (gridAlign === "center") offsetX = Math.round((fullRowWidth - totalRowWidth) / 2);
        else if (gridAlign === "right") offsetX = fullRowWidth - totalRowWidth;
        targetLeft = startLeft + offsetX + col * (photoW + gridGapH);
      }

      var gdx = targetLeft - items[gi].bounds.left;
      var gdy = targetTop - items[gi].bounds.top;

      if (gdx === 0 && gdy === 0) { placed++; continue; }

      // Kep mozgatasa
      translateLayer(items[gi].id, gdx, gdy);

      if (!imagesOnly) {
        // Testver layerek mozgatasa ugyanazzal a delta-val
        var gridSibs = [];
        findAllLayersByName(doc, items[gi].name, gridSibs);
        for (var gs2 = 0; gs2 < gridSibs.length; gs2++) {
          if (gridSibs[gs2].id === items[gi].id) continue;
          translateLayer(gridSibs[gs2].id, gdx, gdy);
        }
      }

      // Bounds frissitese a kovetkezo iteraciohoz
      items[gi].bounds.left += gdx;
      items[gi].bounds.right += gdx;
      items[gi].bounds.top += gdy;
      items[gi].bounds.bottom += gdy;

      placed++;
    }

    // Relink: visszalinkeljuk a szemelyek layereit
    relinkAll(doc, items);

    restoreSelection(selected);
    _eqResult = '{"mode":"grid","placed":' + placed + ',"cols":' + gridCols + ',"rows":' + totalRows + ',"imagesOnly":' + (imagesOnly ? 'true' : 'false') + '}';
    return;
  }

  // --- CSAK FELSO EL IGAZITAS (gap nelkul) ---
  if (alignTopOnly) {
    var refTop = items[0].bounds.top;
    var aligned = 0;

    unlinkAll(doc, items);

    for (var t = 1; t < items.length; t++) {
      var dy2 = refTop - items[t].bounds.top;
      if (dy2 === 0) continue;

      translateLayer(items[t].id, 0, dy2);

      if (!imagesOnly) {
        var sibs = [];
        findAllLayersByName(doc, items[t].name, sibs);
        for (var sb = 0; sb < sibs.length; sb++) {
          if (sibs[sb].id === items[t].id) continue;
          translateLayer(sibs[sb].id, 0, dy2);
        }
      }
      aligned++;
    }

    // Relink
    relinkAll(doc, items);

    restoreSelection(selected);
    _eqResult = '{"mode":"align-top","aligned":' + aligned + ',"imagesOnly":' + (imagesOnly ? 'true' : 'false') + '}';
    return;
  }

  // --- MERESI MOD ---
  if (gapHPxStr === "") {
    var gaps = [];
    for (var m = 0; m < items.length - 1; m++) {
      var gap = items[m + 1].bounds.left - items[m].bounds.right;
      gaps.push(Math.round(gap));
    }
    var sum = 0;
    for (var s = 0; s < gaps.length; s++) sum += gaps[s];
    var avg = gaps.length > 0 ? Math.round(sum / gaps.length) : 0;

    // Gap lista string: [1,2,3]
    var gapStr = "[";
    for (var gs = 0; gs < gaps.length; gs++) {
      if (gs > 0) gapStr += ",";
      gapStr += gaps[gs];
    }
    gapStr += "]";

    restoreSelection(selected);
    var dpi = doc.resolution;
    _eqResult = '{"mode":"measure","avgGapPx":' + avg + ',"count":' + items.length + ',"dpi":' + dpi + ',"gaps":' + gapStr + '}';
    return;
  }

  // --- VEGREHAJTAS MOD ---
  var gapHPx = parseInt(gapHPxStr, 10);
  if (isNaN(gapHPx)) gapHPx = 0;

  var firstTop = items[0].bounds.top;
  var moved = 0;

  // Unlink az erintett layerekrol (kulonben a linkelt nevek/poziciok duplán mozdulnak)
  unlinkAll(doc, items);

  for (var e = 1; e < items.length; e++) {
    var prevRight = items[e - 1].bounds.right;
    var currLeft = items[e].bounds.left;
    var currTop = items[e].bounds.top;

    // Kiszamitott uj pozicio
    var targetLeft = prevRight + gapHPx;
    var dx = targetLeft - currLeft;
    var dy = alignTop ? (firstTop - currTop) : 0;

    if (dx === 0 && dy === 0) {
      continue; // Nincs mozgas, bounds valtozatlan
    }

    // Kep mozgatasa
    translateLayer(items[e].id, dx, dy);

    if (!imagesOnly) {
      // MINDEN azonos nevu layer mozgatasa (Names, Positions, keretek, stb.)
      var siblings = [];
      findAllLayersByName(doc, items[e].name, siblings);
      for (var s = 0; s < siblings.length; s++) {
        // A kepet mar mozgattuk, azt kihagyjuk
        if (siblings[s].id === items[e].id) continue;
        translateLayer(siblings[s].id, dx, dy);
      }
    }

    // Bounds frissitese a kovetkezo iteraciohoz
    items[e].bounds.left += dx;
    items[e].bounds.right += dx;
    items[e].bounds.top += dy;
    items[e].bounds.bottom += dy;

    moved++;
  }

  // Relink
  relinkAll(doc, items);

  restoreSelection(selected);

  _eqResult = '{"mode":"execute","moved":' + moved + ',"imagesOnly":' + (imagesOnly ? 'true' : 'false') + '}';

  } finally {
    app.preferences.rulerUnits = oldRulerUnits;
  }
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Racs / egyenletes elosztas", "doEqualizeGrid()");
  }
} catch (e) {
  _eqResult = '{"error":"' + e.message.replace(/"/g, '\\"') + '"}';
}

_eqResult;

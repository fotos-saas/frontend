/**
 * arrange-names-selected.jsx — Nev layerek pozicionalasa a kepek ala
 *
 * Ha vannak kijelolt layerek → csak azok nev-parjait rendezi.
 * Ha nincs kijeloles → az osszes nevet rendezi (Names/Students + Names/Teachers).
 *
 * Optimalizaciok:
 * - Layer lookup map: egyszer epitjuk fel, O(1) kereses
 * - Bounds cache: layer ID alapjan, nincs dupla lekerdezes
 * - Batch unlink: egyszer jarja be a dokumentumot, NEM szemelynkent
 * - getBoundsNoEffects: kozvetlenul ID-val, NEM selectal
 *
 * CONFIG parameterei:
 *   CONFIG.TEXT_ALIGN = "left" | "center" | "right" (default: "center")
 *   CONFIG.NAME_GAP_PX = szam (default: kep szelesseg * 0.08)
 *   CONFIG.BREAK_AFTER = szam (default: 0 — nincs sortores)
 *   CONFIG.NAME_MAP = JSON object string {"layerName":"DB nev",...} (optional)
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Cache-ek ---
var _boundsCache = {};
var _baselineOffsetSel = null;
var _baselineOffsetPosSel = null;

// --- Layer bounds EFFEKTEK NELKUL (CACHE-ELT, SELECT NELKUL) ---
function getBoundsNoEffects(layerId) {
  var cacheKey = String(layerId);
  if (_boundsCache[cacheKey]) return _boundsCache[cacheKey];

  var ref = new ActionReference();
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
  var result = {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };
  _boundsCache[cacheKey] = result;
  return result;
}

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

// --- Szuri a kijelolt layereket: csak Images csoportbeliek ---
function getImageSelectionNames(doc, selected, imageCache) {
  var names = [];
  var processed = {};
  for (var i = 0; i < selected.length; i++) {
    var n = selected[i].name;
    if (processed[n]) continue;
    var imgLayer = imageCache[n];
    if (imgLayer && imgLayer.id === selected[i].id) {
      processed[n] = true;
      names.push(n);
    }
  }
  return names;
}

// --- CACHE: Layer map-ek felepitese (1 bejaras/csoport) ---
function buildLayerCaches(doc) {
  var images = {};
  var positions = {};
  var names = {};
  var imgGroups = [["Images", "Students"], ["Images", "Teachers"]];
  var posGroups = [["Positions", "Students"], ["Positions", "Teachers"]];
  var nameGroups = [["Names", "Students"], ["Names", "Teachers"]];

  for (var g = 0; g < imgGroups.length; g++) {
    var grp = getGroupByPath(doc, imgGroups[g]);
    if (!grp) continue;
    for (var i = 0; i < grp.artLayers.length; i++) {
      var name = grp.artLayers[i].name;
      if (!images[name]) images[name] = grp.artLayers[i];
    }
  }
  for (var p = 0; p < posGroups.length; p++) {
    var pGrp = getGroupByPath(doc, posGroups[p]);
    if (!pGrp) continue;
    for (var j = 0; j < pGrp.artLayers.length; j++) {
      var pName = pGrp.artLayers[j].name;
      if (!positions[pName]) positions[pName] = pGrp.artLayers[j];
    }
  }
  for (var n = 0; n < nameGroups.length; n++) {
    var nGrp = getGroupByPath(doc, nameGroups[n]);
    if (!nGrp) continue;
    for (var k = 0; k < nGrp.artLayers.length; k++) {
      var nName = nGrp.artLayers[k].name;
      if (!names[nName]) names[nName] = nGrp.artLayers[k];
    }
  }
  return { images: images, positions: positions, names: names };
}

// --- Batch unlink: EGYSZER jarja be a teljes dokumentumot ---
function batchUnlinkByNames(doc, nameSet) {
  _batchUnlinkWalk(doc, nameSet);
}

function _batchUnlinkWalk(container, nameSet) {
  try {
    for (var i = 0; i < container.artLayers.length; i++) {
      if (nameSet[container.artLayers[i].name]) {
        try { container.artLayers[i].unlink(); } catch (e) {}
      }
    }
  } catch (e) {}
  try {
    for (var j = 0; j < container.layerSets.length; j++) {
      _batchUnlinkWalk(container.layerSets[j], nameSet);
    }
  } catch (e) {}
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
  var hyphenIndex = -1;
  for (var h = 0; h < words.length; h++) {
    if (words[h].indexOf("-") !== -1) { hyphenIndex = h; break; }
  }
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(" ") + "\r" + words.slice(hyphenIndex + 1).join(" ");
  }
  if (realCount < 3) return name;
  var realWordCount = 0;
  var breakIndex = -1;
  for (var i = 0; i < words.length; i++) {
    if (!isPrefix(words[i])) realWordCount++;
    if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
  }
  if (breakIndex === -1) return name;
  return words.slice(0, breakIndex).join(" ") + "\r" + words.slice(breakIndex).join(" ");
}

// --- Baseline offset meres (1x fut) ---
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

  delete _boundsCache[String(refLayer.id)];
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

  delete _boundsCache[String(refLayer.id)];
  refLayer.remove();
  return offset;
}

// --- Pozicio layer pozicionalasa a nev ala ---
function positionPositionLayerUnderName(doc, posLayer, nameBottom, imgBounds, textAlign) {
  var dpi = doc.resolution;
  var posGapCm = typeof CONFIG !== "undefined" && CONFIG.POSITION_GAP_CM ? CONFIG.POSITION_GAP_CM : 0.15;
  var posGapPx = Math.round((posGapCm / 2.54) * dpi);

  var posFontSize = typeof CONFIG !== "undefined" && CONFIG.POSITION_FONT_SIZE ? CONFIG.POSITION_FONT_SIZE : 18;
  if (_baselineOffsetPosSel === null) {
    _baselineOffsetPosSel = measureBaselineOffsetForSize(doc, posFontSize);
  }

  var posBoundsTop = nameBottom + posGapPx;
  var posBaselineY = posBoundsTop + _baselineOffsetPosSel;

  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = (imgBounds.left + imgBounds.right) / 2;
  }

  selectLayerById(posLayer.id);
  try {
    var posTextItem = posLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      posTextItem.justification = alignMap[textAlign];
    }
    posTextItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(posBaselineY), "px")];
  } catch (e) {}
}

// --- Nev pozicionalasa a kep ala ---
function positionNameUnderImage(doc, nameLayer, imgBounds, gapPx, textAlign, breakAfter, nameMap) {
  var imgCenterX = (imgBounds.left + imgBounds.right) / 2;
  var imgBottom = imgBounds.bottom;

  if (gapPx <= 0) {
    gapPx = Math.round((imgBounds.right - imgBounds.left) * 0.08);
  }

  if (_baselineOffsetSel === null) {
    _baselineOffsetSel = measureBaselineOffset(doc);
  }

  selectLayerById(nameLayer.id);

  try {
    var textItem = nameLayer.textItem;
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[textAlign]) {
      textItem.justification = alignMap[textAlign];
    }
    if (nameMap && nameMap[nameLayer.name]) {
      var plainName = nameMap[nameLayer.name];
      var newText = breakName(plainName, breakAfter);
      if (textItem.contents !== newText) {
        textItem.contents = newText;
        delete _boundsCache[String(nameLayer.id)];
      }
    }
  } catch (e) {
    return null;
  }

  var desiredBoundsTop = imgBottom + gapPx;
  var desiredBaselineY = desiredBoundsTop + _baselineOffsetSel;

  var desiredX;
  if (textAlign === "left") {
    desiredX = imgBounds.left;
  } else if (textAlign === "right") {
    desiredX = imgBounds.right;
  } else {
    desiredX = imgCenterX;
  }

  textItem.position = [new UnitValue(Math.round(desiredX), "px"), new UnitValue(Math.round(desiredBaselineY), "px")];

  var fontSize = typeof CONFIG !== "undefined" && CONFIG.FONT_SIZE ? CONFIG.FONT_SIZE : 25;
  var fontHeightPx = (fontSize / 72) * doc.resolution;
  var lineCount = 1;
  try {
    var content = textItem.contents;
    for (var ci = 0; ci < content.length; ci++) {
      if (content.charAt(ci) === "\r") lineCount++;
    }
  } catch (e) {}
  var nameBottom = desiredBoundsTop + (fontHeightPx * lineCount * 1.2);
  return { imgBounds: imgBounds, nameBottom: nameBottom };
}

// --- JSON object parser (ES3) ---
function parseSimpleJsonObject(str) {
  var obj = {};
  if (!str || str.length < 2) return obj;
  str = str.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  if (str.length === 0) return obj;
  var re = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  var match;
  while ((match = re.exec(str)) !== null) {
    var key = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    var val = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    obj[key] = val;
  }
  return obj;
}

function escapeJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

var _arrangeResult = '{"arranged":0}';

function doArrangeNames() {
  var doc = app.activeDocument;


  var textAlign = typeof CONFIG !== "undefined" && CONFIG.TEXT_ALIGN ? CONFIG.TEXT_ALIGN : "center";
  var breakAfter = typeof CONFIG !== "undefined" && CONFIG.BREAK_AFTER ? parseInt(CONFIG.BREAK_AFTER, 10) : 0;

  var nameGapPx = 0;
  if (typeof CONFIG !== "undefined" && CONFIG.NAME_GAP_CM) {
    var dpi = doc.resolution;
    nameGapPx = Math.round((parseFloat(CONFIG.NAME_GAP_CM) / 2.54) * dpi);
  } else if (typeof CONFIG !== "undefined" && CONFIG.NAME_GAP_PX) {
    nameGapPx = parseInt(CONFIG.NAME_GAP_PX, 10);
  }

  var targetGroupRaw = typeof CONFIG !== "undefined" && CONFIG.TARGET_GROUP ? CONFIG.TARGET_GROUP : "";
  var targetGroup = targetGroupRaw.toLowerCase();
  var hasExplicitTarget = targetGroup === "students" || targetGroup === "teachers" || targetGroup === "all";

  var selected = hasExplicitTarget ? [] : getSelectedLayerInfo();

  // CACHE: egyszer felepitjuk az osszes layer map-et
  var cache = buildLayerCaches(doc);

  var nameLayers = [];
  var imageNames = (selected.length > 0) ? getImageSelectionNames(doc, selected, cache.images) : [];

  if (imageNames.length > 0) {
    for (var i = 0; i < imageNames.length; i++) {
      var nl = cache.names[imageNames[i]];
      if (nl) nameLayers.push(nl);
    }
  } else if (targetGroup === "students") {
    var sGrp = getGroupByPath(doc, ["Names", "Students"]);
    if (sGrp) { for (var si = 0; si < sGrp.artLayers.length; si++) nameLayers.push(sGrp.artLayers[si]); }
  } else if (targetGroup === "teachers") {
    var tGrp = getGroupByPath(doc, ["Names", "Teachers"]);
    if (tGrp) { for (var ti2 = 0; ti2 < tGrp.artLayers.length; ti2++) nameLayers.push(tGrp.artLayers[ti2]); }
  } else {
    for (var nk in cache.names) {
      if (cache.names.hasOwnProperty(nk)) nameLayers.push(cache.names[nk]);
    }
  }

  var doNames = typeof CONFIG === "undefined" || !CONFIG.SKIP_NAMES || CONFIG.SKIP_NAMES !== "true";
  var doPositions = typeof CONFIG === "undefined" || !CONFIG.SKIP_POSITIONS || CONFIG.SKIP_POSITIONS !== "true";

  var _nameMap = null;
  if (doNames && typeof CONFIG !== "undefined" && CONFIG.NAME_MAP && CONFIG.NAME_MAP !== "") {
    _nameMap = parseSimpleJsonObject(CONFIG.NAME_MAP);
  }

  // BATCH UNLINK: EGYSZER jarja be a teljes dokumentumot (NEM szemelynkent!)
  var unlinkSet = {};
  for (var u = 0; u < nameLayers.length; u++) {
    unlinkSet[nameLayers[u].name] = true;
  }
  batchUnlinkByNames(doc, unlinkSet);

  // Baseline offset elomeres (1x)
  if (doNames) {
    _baselineOffsetSel = measureBaselineOffset(doc);
  }

  var arranged = 0;
  for (var j = 0; j < nameLayers.length; j++) {
    var nameL = nameLayers[j];
    var imgLayer = cache.images[nameL.name] || null;
    if (!imgLayer) continue;

    // imgBounds 1x lekerdezve, cache-elve
    var imgBounds = getBoundsNoEffects(imgLayer.id);

    if (doNames) {
      var result = positionNameUnderImage(doc, nameL, imgBounds, nameGapPx, textAlign, breakAfter, _nameMap);
      if (result) {
        arranged++;
        if (doPositions) {
          var posLayer = cache.positions[nameL.name] || null;
          if (posLayer) {
            positionPositionLayerUnderName(doc, posLayer, result.nameBottom, result.imgBounds, textAlign);
          }
        }
      }
    } else if (doPositions) {
      var nameLayerBounds = getBoundsNoEffects(nameL.id);
      var posLayerOnly = cache.positions[nameL.name] || null;
      if (posLayerOnly) {
        positionPositionLayerUnderName(doc, posLayerOnly, nameLayerBounds.bottom, imgBounds, textAlign);
        arranged++;
      }
    }
  }

  // Kijeloles visszaallitasa
  if (selected.length > 0) {
    var selIds = [];
    for (var s = 0; s < selected.length; s++) {
      selIds.push(selected[s].id);
    }
    selectMultipleLayersById(selIds);
  }

  _arrangeResult = '{"arranged":' + arranged + '}';
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Arrange names", "doArrangeNames()");
  }
} catch (e) {
  _arrangeResult = '{"arranged":0,"error":"' + escapeJsonStr(e.message) + '"}';
}

_arrangeResult;

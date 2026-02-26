/**
 * arrange-subtitles.jsx — Felirat layerek pozicionalasa a szabad zonaba
 *
 * A Subtitles csoport layereit fuggoleges kozepre igazitja
 * a tanárok es diakok kozotti szabad zonaban.
 *
 * JSON formatum:
 * {
 *   "freeZoneTopPx": 500,
 *   "freeZoneBottomPx": 3000,
 *   "subtitleGapPx": 30
 * }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc, _data;

function _doArrangeSubtitles() {
  var subtitlesGroup = getGroupByPath(_doc, ["Subtitles"]);
  if (!subtitlesGroup) {
    log("[JSX] WARN: Subtitles csoport nem talalhato — kihagyas");
    return;
  }

  // Layerek osszegyujtese (alulrol felfelre — PS sorrend)
  var layers = [];
  for (var i = subtitlesGroup.artLayers.length - 1; i >= 0; i--) {
    var layer = subtitlesGroup.artLayers[i];
    if (!layer.visible) continue;

    selectLayerById(layer.id);
    var bnfe = _getBoundsNoEffects(layer);
    var h = Math.round(bnfe.bottom - bnfe.top);
    var w = Math.round(bnfe.right - bnfe.left);

    layers.push({
      layer: layer,
      width: w,
      height: h,
      bounds: bnfe
    });
  }

  if (layers.length === 0) {
    log("[JSX] Subtitles csoport ures — nincs pozicionalando layer");
    return;
  }

  var gapPx = _data.subtitleGapPx || 30;
  var freeTop = _data.freeZoneTopPx;
  var freeBottom = _data.freeZoneBottomPx;
  var freeH = freeBottom - freeTop;

  // Blokk magassag kiszamitasa
  var blockH = 0;
  for (var j = 0; j < layers.length; j++) {
    blockH += layers[j].height;
    if (j < layers.length - 1) blockH += gapPx;
  }

  log("[JSX] Feliratok: " + layers.length + " layer, blokk=" + blockH + "px, zona=" + freeH + "px");

  if (blockH > freeH) {
    log("[JSX] WARN: Felirat blokk (" + blockH + "px) nagyobb mint a szabad zona (" + freeH + "px)!");
  }

  // Blokk start Y: fuggoleges kozepre a szabad zonaban
  var blockStartY = freeTop + Math.round((freeH - blockH) / 2);
  var docW = Math.round(_doc.width.as("px"));
  var docCenterX = Math.round(docW / 2);

  log("[JSX] Blokk start Y=" + blockStartY + "px, doc kozep X=" + docCenterX + "px");

  var currentY = blockStartY;

  for (var k = 0; k < layers.length; k++) {
    var info = layers[k];
    var lyr = info.layer;

    try {
      selectLayerById(lyr.id);
      _doc.activeLayer = lyr;

      // Cel pozicio: vizszintesen kozepre, fuggoleges currentY-ra
      var targetX = Math.round((docW - info.width) / 2);
      var targetY = currentY;

      // Bounds-alapu delta (minden layer tipusnal mukodik — text es nem-text)
      // A translate delta-t a jelenlegi bounds-bol szamoljuk
      var curBounds = _getBoundsNoEffects(lyr);
      var dx = targetX - curBounds.left;
      var dy = targetY - curBounds.top;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        lyr.translate(new UnitValue(Math.round(dx), "px"), new UnitValue(Math.round(dy), "px"));
      }

      log("[JSX] Layer '" + lyr.name + "': X=" + targetX + ", Y=" + targetY + "px, h=" + info.height + "px");

    } catch (e) {
      log("[JSX] WARN: Layer '" + lyr.name + "' pozicionalas sikertelen: " + e.message);
    }

    currentY += info.height + gapPx;
  }
}

// --- Layer bounds EFFEKTEK NELKUL (masolat az arrange-grid.jsx-bol) ---
function _getBoundsNoEffects(layer) {
  selectLayerById(layer.id);
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

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name + " (" + _doc.width + " x " + _doc.height + ")");

    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data || typeof _data.freeZoneTopPx === "undefined") {
      log("[JSX] Nincs szabad zona adat — kilep.");
      return;
    }

    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    _doc.suspendHistory("Felirat pozicionalas", "_doArrangeSubtitles()");

    app.preferences.rulerUnits = oldRulerUnits;

    log("[JSX] KESZ");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

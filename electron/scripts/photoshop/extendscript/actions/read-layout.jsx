/**
 * read-layout.jsx — Tablo layout pozicio-regiszter kiolvasasa (v3)
 *
 * Rekurzivan bejarje a TELJES dokumentumot es minden layerhez
 * kinyeri a poziciot (boundsNoEffects), layerId-t es groupPath-ot.
 * Text layereknel extra text + justification mezok.
 *
 * Az eredmeny JSON string-kent a _logLines-ban kerul vissza
 * (osascript stdout → Electron handler parse-olja).
 *
 * JSON formatum (Electron handler kesziti):
 * { "targetDocName": "optional" }
 *
 * Futtatas: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

// --- Globalis valtozok ---
var _doc;

// --- Layer descriptor kiolvasas (bounds + SO info) ---
// Egyetlen executeActionGet hivassal kinyerjuk a bounds-ot es SO allapotot
function _getLayerDescriptor(layer) {
  selectLayerById(layer.id);
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);

  // Bounds (effekt nelkul ha elerheto)
  var boundsKey = stringIDToTypeID("boundsNoEffects");
  var b;
  if (desc.hasKey(boundsKey)) {
    b = desc.getObjectValue(boundsKey);
  } else {
    b = desc.getObjectValue(stringIDToTypeID("bounds"));
  }

  var bounds = {
    left: b.getUnitDoubleValue(stringIDToTypeID("left")),
    top: b.getUnitDoubleValue(stringIDToTypeID("top")),
    right: b.getUnitDoubleValue(stringIDToTypeID("right")),
    bottom: b.getUnitDoubleValue(stringIDToTypeID("bottom"))
  };

  // Linked Layers: a linkedLayerIDs lista nem ures → layer ossze van linkelve masokkal
  var linked = false;
  var linkedKey = stringIDToTypeID("linkedLayerIDs");
  if (desc.hasKey(linkedKey)) {
    try {
      var idList = desc.getList(linkedKey);
      linked = (idList.count > 0);
    } catch (e) {
      // nem lista vagy kiolvasasi hiba
    }
  }

  return { bounds: bounds, linked: linked };
}

// --- JSON string epites (ES3 — nincs JSON.stringify!) ---
// Egyszeru JSON serializer objektumokhoz es tombokhoz
function _jsonStringify(obj) {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "string") {
    // Escape-eles
    var s = obj.replace(/\\/g, "\\\\")
               .replace(/"/g, '\\"')
               .replace(/\n/g, "\\n")
               .replace(/\r/g, "\\r")
               .replace(/\t/g, "\\t");
    return '"' + s + '"';
  }
  // Tomb
  if (obj instanceof Array) {
    var items = [];
    for (var i = 0; i < obj.length; i++) {
      items.push(_jsonStringify(obj[i]));
    }
    return "[" + items.join(",") + "]";
  }
  // Objektum
  if (typeof obj === "object") {
    var pairs = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        pairs.push('"' + key + '":' + _jsonStringify(obj[key]));
      }
    }
    return "{" + pairs.join(",") + "}";
  }
  return String(obj);
}

// --- Rekurziv layer bejaras — MINDEN layer a dokumentumbol ---
// container: LayerSet vagy Document
// pathSoFar: string tomb — aktualis csoport utvonal (pl. ["Images", "Students"])
// result: tomb — ide gyujtjuk a layer adatokat
function _readAllLayers(container, pathSoFar, result) {
  // 1. artLayerek feldolgozasa (fordított sorrend — Photoshop igy tarolja)
  try {
    for (var i = container.artLayers.length - 1; i >= 0; i--) {
      var layer = container.artLayers[i];
      try {
        // Rejtett layereket kihagyjuk — nem kellenek a snapshotba
        if (!layer.visible) continue;

        var info = _getLayerDescriptor(layer);
        var x = Math.round(info.bounds.left);
        var y = Math.round(info.bounds.top);
        var w = Math.round(info.bounds.right - info.bounds.left);
        var h = Math.round(info.bounds.bottom - info.bounds.top);

        // 0 meretu layereket kihagyjuk (ures placeholder-ek)
        if (w <= 0 || h <= 0) continue;

        var layerData = {
          layerId: layer.id,
          layerName: layer.name,
          groupPath: pathSoFar,
          x: x,
          y: y,
          width: w,
          height: h,
          kind: "normal",
          visible: true
        };

        // Linked Layers jelzes (lánc ikon a PS Layers panelen)
        if (info.linked) {
          layerData.linked = true;
        }

        // Text layerek extra adatai
        if (layer.kind === LayerKind.TEXT) {
          layerData.kind = "text";
          try {
            layerData.text = layer.textItem.contents;
            var j = layer.textItem.justification;
            if (j === Justification.LEFT) layerData.justification = "left";
            else if (j === Justification.RIGHT) layerData.justification = "right";
            else layerData.justification = "center";
          } catch (te) {
            layerData.text = "";
            layerData.justification = "center";
          }
        }

        result.push(layerData);
      } catch (e) {
        log("[JSX] WARN: Layer olvasas sikertelen (" + layer.name + "): " + e.message);
      }
    }
  } catch (e) { /* nincs artLayers */ }

  // 2. LayerSet-ek rekurziv bejara (fordított sorrend)
  try {
    for (var j = container.layerSets.length - 1; j >= 0; j--) {
      var grp = container.layerSets[j];
      // Rejtett csoportokat kihagyjuk
      if (!grp.visible) continue;
      // Uj groupPath — ES3: concat nem mutál
      var childPath = [];
      for (var k = 0; k < pathSoFar.length; k++) {
        childPath.push(pathSoFar[k]);
      }
      childPath.push(grp.name);

      _readAllLayers(grp, childPath, result);
    }
  } catch (e) { /* nincs layerSets */ }
}

(function () {
  try {
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // DPI kiolvasas
    var dpi = _doc.resolution;

    // Ruler PIXELS-re (szamitasok pixelben)
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Dokumentum meretek pixelben
    var docWidthPx = Math.round(_doc.width.as("px"));
    var docHeightPx = Math.round(_doc.height.as("px"));

    // Rekurziv bejara — MINDEN layer
    var allLayers = [];
    _readAllLayers(_doc, [], allLayers);

    // Eredmeny objektum
    var result = {
      document: {
        name: _doc.name,
        widthPx: docWidthPx,
        heightPx: docHeightPx,
        dpi: dpi
      },
      layers: allLayers
    };

    // Ruler visszaallitasa
    app.preferences.rulerUnits = oldRulerUnits;

    // Eredmeny JSON string-kent — specialis prefix a handler parse-olasahoz
    log("__LAYOUT_JSON__" + _jsonStringify(result));

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

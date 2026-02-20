/**
 * read-layout.jsx — Tablo layout pozicio-regiszter kiolvasasa
 *
 * Bejarje az Images/Students + Images/Teachers csoportokat,
 * es minden layerhoz kinyeri a poziciot (boundsNoEffects) es a personId-t.
 * A dokumentum meretet es DPI-t is visszaadja.
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

// --- Layer bounds EFFEKTEK NELKUL (boundsNoEffects) ---
// Ugyanaz mint arrange-grid.jsx-ben — effekt nelkuli meretek
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

// --- PersonId kinyerese a layer nevbol ---
// Layer nev formatum: "kiss-janos---42" → personId = 42
// A "---" elvalaszto utan jon az ID szam
function _extractPersonId(layerName) {
  var idx = layerName.lastIndexOf("---");
  if (idx === -1) return null;
  var idStr = layerName.substring(idx + 3);
  var id = parseInt(idStr, 10);
  if (isNaN(id)) return null;
  return id;
}

// --- Nev visszafejtese a layer nevbol ---
// "kiss-janos---42" → "kiss-janos" (kotojeles slug, nem az eredeti nev)
function _extractSlugName(layerName) {
  var idx = layerName.lastIndexOf("---");
  if (idx === -1) return layerName;
  return layerName.substring(0, idx);
}

// --- Name csoport layer-einek kiolvasasa (text layerek) ---
// Visszaad egy tombot: [{personId, layerName, x, y, width, height, text, justification}, ...]
// A textItem.contents tartalmazza a sortoreseket (\r Photoshopban)
function _readNameGroupLayers(grp, personType) {
  var result = [];
  if (!grp) return result;

  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var layer = grp.artLayers[i];
    try {
      // Csak text layereket olvassuk
      if (layer.kind !== LayerKind.TEXT) continue;

      var bnfe = _getBoundsNoEffects(layer);
      var x = Math.round(bnfe.left);
      var y = Math.round(bnfe.top);
      var w = Math.round(bnfe.right - bnfe.left);
      var h = Math.round(bnfe.bottom - bnfe.top);

      var personId = _extractPersonId(layer.name);
      var slugName = _extractSlugName(layer.name);

      // Text tartalom es igazitas kiolvasasa
      var textContent = "";
      var justification = "center";
      try {
        textContent = layer.textItem.contents;
        var j = layer.textItem.justification;
        if (j === Justification.LEFT) justification = "left";
        else if (j === Justification.RIGHT) justification = "right";
        else justification = "center";
      } catch (te) {
        // textItem nem elerheto — skip
      }

      result.push({
        personId: personId,
        name: slugName,
        type: personType,
        layerName: layer.name,
        x: x,
        y: y,
        width: w,
        height: h,
        text: textContent,
        justification: justification
      });
    } catch (e) {
      log("[JSX] WARN: Name layer olvasas sikertelen (" + layer.name + "): " + e.message);
    }
  }

  return result;
}

// --- Egy csoport layer-einek kiolvasasa ---
// Visszaad egy tombot: [{personId, layerName, x, y, width, height}, ...]
function _readGroupLayers(grp, personType) {
  var result = [];
  if (!grp) return result;

  // artLayers: Photoshop forditott sorrendben tarolja (utolso = elso hozzaadott)
  for (var i = grp.artLayers.length - 1; i >= 0; i--) {
    var layer = grp.artLayers[i];
    try {
      var bnfe = _getBoundsNoEffects(layer);
      var x = Math.round(bnfe.left);
      var y = Math.round(bnfe.top);
      var w = Math.round(bnfe.right - bnfe.left);
      var h = Math.round(bnfe.bottom - bnfe.top);

      var personId = _extractPersonId(layer.name);
      var slugName = _extractSlugName(layer.name);

      result.push({
        personId: personId,
        name: slugName,
        type: personType,
        layerName: layer.name,
        x: x,
        y: y,
        width: w,
        height: h
      });
    } catch (e) {
      log("[JSX] WARN: Layer olvasas sikertelen (" + layer.name + "): " + e.message);
    }
  }

  return result;
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

(function () {
  try {
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum!");
    }
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);

    // DPI kiolvasas
    var dpi = _doc.resolution;

    // Ruler PIXELS-re (szamitasok pixelben)
    var oldRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Dokumentum meretek pixelben
    var docWidthPx = Math.round(_doc.width.as("px"));
    var docHeightPx = Math.round(_doc.height.as("px"));

    // Diak csoport kiolvasasa
    var studentsGroup = getGroupByPath(_doc, ["Images", "Students"]);
    var studentLayers = _readGroupLayers(studentsGroup, "student");

    // Tanar csoport kiolvasasa
    var teachersGroup = getGroupByPath(_doc, ["Images", "Teachers"]);
    var teacherLayers = _readGroupLayers(teachersGroup, "teacher");

    // Osszes szemely egybeolvasztasa
    var allPersons = [];
    for (var si = 0; si < studentLayers.length; si++) {
      allPersons.push(studentLayers[si]);
    }
    for (var ti = 0; ti < teacherLayers.length; ti++) {
      allPersons.push(teacherLayers[ti]);
    }

    // Nev layerek kiolvasasa (Names/Students + Names/Teachers)
    var nameStudentsGroup = getGroupByPath(_doc, ["Names", "Students"]);
    var nameStudentLayers = _readNameGroupLayers(nameStudentsGroup, "student");

    var nameTeachersGroup = getGroupByPath(_doc, ["Names", "Teachers"]);
    var nameTeacherLayers = _readNameGroupLayers(nameTeachersGroup, "teacher");

    var allNamePersons = [];
    for (var nsi = 0; nsi < nameStudentLayers.length; nsi++) {
      allNamePersons.push(nameStudentLayers[nsi]);
    }
    for (var nti = 0; nti < nameTeacherLayers.length; nti++) {
      allNamePersons.push(nameTeacherLayers[nti]);
    }

    // Eredmeny objektum
    var result = {
      document: {
        name: _doc.name,
        widthPx: docWidthPx,
        heightPx: docHeightPx,
        dpi: dpi
      },
      persons: allPersons,
      namePersons: allNamePersons
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

/**
 * add-extra-names.jsx — Extra nevek beillesztese/frissitese a megnyitott PSD-ben
 *
 * Letrehoz egy "ExtraNames" nevu main groupot (LayerSet) a dokumentumban,
 * benne header + names text layer parokkal a tanarokhoz es diakokhoz.
 * Ha a group mar letezik, a meglevo layerek tartalmat frissiti.
 *
 * JSON formatum:
 * {
 *   "students": { "header": "Osztalytarsaink voltak meg:", "names": "Kiss Peter, Nagy Anna" },
 *   "teachers": { "header": "Tanitottak meg:", "names": "Dr. Kovacs Bela, Toth Maria" },
 *   "includeStudents": true,
 *   "includeTeachers": true,
 *   "font": "ArialMT",
 *   "fontSize": 20,
 *   "headerFontSize": 22,
 *   "textColor": { "r": 0, "g": 0, "b": 0 },
 *   "textAlign": "center"
 * }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

var _doc, _data;

/**
 * Layer keresese nev alapjan egy csoportban (artLayers kozott)
 */
function findLayerByName(group, name) {
  try {
    for (var i = 0; i < group.artLayers.length; i++) {
      if (group.artLayers[i].name === name) return group.artLayers[i];
    }
  } catch (e) { /* ures csoport */ }
  return null;
}

/**
 * Text layer letrehozasa vagy frissitese (upsert).
 * Ha letezik: tartalom frissites, ha nem: uj layer letrehozas.
 */
function upsertTextLayer(group, layerName, text, options) {
  var layer = findLayerByName(group, layerName);
  if (layer) {
    // UPDATE: tartalom frissitese (pozicio megmarad!)
    try {
      layer.textItem.contents = text;
      log("[JSX] Frissitve: " + layerName);
    } catch (e) {
      log("[JSX] HIBA frissites (" + layerName + "): " + e.message);
    }
  } else {
    // INSERT: uj text layer letrehozasa
    try {
      createTextLayer(group, text, {
        name: layerName,
        font: options.font || CONFIG.FONT_NAME,
        size: options.fontSize || CONFIG.FONT_SIZE,
        color: options.color || CONFIG.TEXT_COLOR,
        alignment: options.alignment || "center"
      });
      log("[JSX] Letrehozva: " + layerName);
    } catch (e) {
      log("[JSX] HIBA letrehozas (" + layerName + "): " + e.message);
    }
  }
}

/**
 * Layer torlese nev alapjan (ha a checkbox kikapcsolt)
 */
function removeLayerByName(group, name) {
  var layer = findLayerByName(group, name);
  if (layer) {
    try {
      layer.remove();
      log("[JSX] Torolve: " + name);
    } catch (e) {
      log("[JSX] HIBA torles (" + name + "): " + e.message);
    }
  }
}

function _doAddExtraNames() {
  var groupName = "ExtraNames";
  var group = getGroupByPath(_doc, [groupName]);

  // Ha nem letezik a group, letrehozzuk
  if (!group) {
    group = _doc.layerSets.add();
    group.name = groupName;
    log("[JSX] ExtraNames csoport letrehozva");
  }

  var font = _data.font || CONFIG.FONT_NAME;
  var textColor = _data.textColor || CONFIG.TEXT_COLOR;
  var align = _data.textAlign || "center";

  // Tanarok
  if (_data.includeTeachers && _data.teachers && _data.teachers.names && _data.teachers.names.length > 0) {
    upsertTextLayer(group, "extra-teachers-header", _data.teachers.header, {
      font: font,
      fontSize: _data.headerFontSize || 22,
      color: textColor,
      alignment: align
    });
    upsertTextLayer(group, "extra-teachers-names", _data.teachers.names, {
      font: font,
      fontSize: _data.fontSize || 20,
      color: textColor,
      alignment: align
    });
  } else {
    // Checkbox kikapcsolt vagy nincs adat → layerek torlese ha leteznek
    removeLayerByName(group, "extra-teachers-header");
    removeLayerByName(group, "extra-teachers-names");
  }

  // Diakok
  if (_data.includeStudents && _data.students && _data.students.names && _data.students.names.length > 0) {
    upsertTextLayer(group, "extra-students-header", _data.students.header, {
      font: font,
      fontSize: _data.headerFontSize || 22,
      color: textColor,
      alignment: align
    });
    upsertTextLayer(group, "extra-students-names", _data.students.names, {
      font: font,
      fontSize: _data.fontSize || 20,
      color: textColor,
      alignment: align
    });
  } else {
    // Checkbox kikapcsolt vagy nincs adat → layerek torlese ha leteznek
    removeLayerByName(group, "extra-students-header");
    removeLayerByName(group, "extra-students-names");
  }

  // Ha a group ures maradt (mindket tipus ki van kapcsolva), toroljuk
  try {
    if (group.artLayers.length === 0 && group.layerSets.length === 0) {
      group.remove();
      log("[JSX] ExtraNames csoport torolve (ures)");
    }
  } catch (e) { /* nem kritikus */ }
}

(function () {
  try {
    // 1. Cel dokumentum aktivalasa
    _doc = activateDocByName(CONFIG.TARGET_DOC_NAME);
    log("[JSX] Dokumentum: " + _doc.name);

    // 2. JSON beolvasas
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH!");
    }

    _data = readJsonFile(args.dataFilePath);

    if (!_data) {
      log("[JSX] Nincs adat — kilep.");
      return;
    }

    log("[JSX] includeStudents=" + !!_data.includeStudents + " includeTeachers=" + !!_data.includeTeachers);

    // 3. Extra nevek hozzaadasa/frissitese — egyetlen history lepes
    _doc.suspendHistory("Extra nevek beillesztese", "_doAddExtraNames()");

    log("[JSX] KESZ");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
  }
})();

_logLines.join("\n");

/**
 * get-image-positions.jsx — Images csoport layer pozicioinak kiolvasasa
 *
 * Visszaadja az Images/Students es Images/Teachers layerek neveit es pozicioit.
 * boundsNoEffects alapjan (effekt nelkuli pozicio).
 *
 * Kimenet (JSON string):
 *   { "students": [{"name":"slug---42","x":120,"y":85}, ...],
 *     "teachers": [{"name":"slug---7","x":120,"y":85}, ...] }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

function escJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

function getLayerBoundsNoEffects(layer) {
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID('Lyr '), layer.id);
  var desc = executeActionGet(ref);
  var boundsDesc = desc.getObjectValue(stringIDToTypeID('boundsNoEffects'));
  return {
    left: boundsDesc.getUnitDoubleValue(stringIDToTypeID('left')),
    top: boundsDesc.getUnitDoubleValue(stringIDToTypeID('top'))
  };
}

function buildPositionJsonArray(arr) {
  var json = "[";
  for (var n = 0; n < arr.length; n++) {
    if (n > 0) json += ",";
    json += '{"name":"' + escJsonStr(arr[n].name) + '","x":' + Math.round(arr[n].x) + ',"y":' + Math.round(arr[n].y) + '}';
  }
  json += "]";
  return json;
}

var __result = (function () {
  if (app.documents.length === 0) {
    return '{"students":[],"teachers":[]}';
  }
  var doc = app.activeDocument;
  var students = [];
  var teachers = [];

  function collectFromGroup(groupPath, target) {
    var grp = getGroupByPath(doc, groupPath);
    if (!grp) return;
    for (var i = 0; i < grp.artLayers.length; i++) {
      var layer = grp.artLayers[i];
      var bounds = getLayerBoundsNoEffects(layer);
      target.push({ name: layer.name, x: bounds.left, y: bounds.top });
    }
  }

  collectFromGroup(["Images", "Students"], students);
  collectFromGroup(["Images", "Teachers"], teachers);

  return '{"students":' + buildPositionJsonArray(students) +
    ',"teachers":' + buildPositionJsonArray(teachers) + '}';
})();
__result;

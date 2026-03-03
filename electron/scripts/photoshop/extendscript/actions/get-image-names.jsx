/**
 * get-image-names.jsx — Images csoport layer neveinek kiolvasasa
 *
 * Visszaadja az Images/Students es Images/Teachers layerek neveit.
 * Kimenet (JSON string):
 *   { "names": ["Nev1", "Nev2", ...], "count": 5 }
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

function buildJsonArray(arr) {
  var json = "[";
  for (var n = 0; n < arr.length; n++) {
    if (n > 0) json += ",";
    json += '"' + escJsonStr(arr[n]) + '"';
  }
  json += "]";
  return json;
}

var __result = (function () {
  if (app.documents.length === 0) {
    return '{"names":[],"students":[],"teachers":[],"count":0}';
  }
  var doc = app.activeDocument;
  var students = [];
  var teachers = [];

  function collectFromGroup(groupPath, target) {
    var grp = getGroupByPath(doc, groupPath);
    if (!grp) return;
    for (var i = 0; i < grp.artLayers.length; i++) {
      target.push(grp.artLayers[i].name);
    }
  }

  collectFromGroup(["Images", "Students"], students);
  collectFromGroup(["Images", "Teachers"], teachers);

  var all = students.concat(teachers);

  return '{"names":' + buildJsonArray(all) +
    ',"students":' + buildJsonArray(students) +
    ',"teachers":' + buildJsonArray(teachers) +
    ',"count":' + all.length + '}';
})();
__result;

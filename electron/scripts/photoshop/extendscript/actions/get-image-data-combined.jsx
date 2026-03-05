/**
 * get-image-data-combined.jsx — Images csoport layer nevek + poziciok egyetlen hivassal
 *
 * Egyesiti a get-image-names.jsx es get-image-positions.jsx funkcionalitasat,
 * igy 2 PS hivas helyett eleg 1.
 *
 * Kimenet (JSON string):
 *   {
 *     "names": ["slug---42", ...],
 *     "students": [{"name":"slug---42","x":120,"y":85}, ...],
 *     "teachers": [{"name":"slug---7","x":120,"y":85}, ...],
 *     "count": 42
 *   }
 *
 * A names tombben csak a layer nevek vannak (students + teachers osszefuzve).
 * A students/teachers tombokben a nev + pozicio is benne van.
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
      var layer = grp.artLayers[i];
      var bounds = getLayerBoundsNoEffects(layer);
      target.push({ name: layer.name, x: bounds.left, y: bounds.top });
    }
  }

  collectFromGroup(["Images", "Students"], students);
  collectFromGroup(["Images", "Teachers"], teachers);

  // Flat names tomb (students + teachers sorrendben)
  var namesJson = "[";
  var allCount = 0;
  for (var s = 0; s < students.length; s++) {
    if (allCount > 0) namesJson += ",";
    namesJson += '"' + escJsonStr(students[s].name) + '"';
    allCount++;
  }
  for (var t = 0; t < teachers.length; t++) {
    if (allCount > 0) namesJson += ",";
    namesJson += '"' + escJsonStr(teachers[t].name) + '"';
    allCount++;
  }
  namesJson += "]";

  // Student names-only tomb (scope szureshez)
  var studentNamesJson = "[";
  for (var sn = 0; sn < students.length; sn++) {
    if (sn > 0) studentNamesJson += ",";
    studentNamesJson += '"' + escJsonStr(students[sn].name) + '"';
  }
  studentNamesJson += "]";

  // Teacher names-only tomb (scope szureshez)
  var teacherNamesJson = "[";
  for (var tn = 0; tn < teachers.length; tn++) {
    if (tn > 0) teacherNamesJson += ",";
    teacherNamesJson += '"' + escJsonStr(teachers[tn].name) + '"';
  }
  teacherNamesJson += "]";

  // Pozicio JSON tombokhoz
  function buildPosArr(arr) {
    var json = "[";
    for (var n = 0; n < arr.length; n++) {
      if (n > 0) json += ",";
      json += '{"name":"' + escJsonStr(arr[n].name) + '","x":' + Math.round(arr[n].x) + ',"y":' + Math.round(arr[n].y) + '}';
    }
    json += "]";
    return json;
  }

  return '{"names":' + namesJson +
    ',"studentNames":' + studentNamesJson +
    ',"teacherNames":' + teacherNamesJson +
    ',"students":' + buildPosArr(students) +
    ',"teachers":' + buildPosArr(teachers) +
    ',"count":' + allCount + '}';
})();
__result;

/**
 * get-image-names.jsx — Images csoport layer neveinek kiolvasasa
 *
 * Visszaadja az Images/Students es Images/Teachers layerek neveit.
 * Kimenet (JSON string):
 *   { "names": ["Nev1", "Nev2", ...], "count": 5 }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

(function () {
  if (app.documents.length === 0) {
    '{"names":[],"count":0}';
    return;
  }
  var doc = app.activeDocument;
  var names = [];

  function collectFromGroup(groupPath) {
    var grp = getGroupByPath(doc, groupPath);
    if (!grp) return;
    for (var i = 0; i < grp.artLayers.length; i++) {
      names.push(grp.artLayers[i].name);
    }
  }

  collectFromGroup(["Images", "Students"]);
  collectFromGroup(["Images", "Teachers"]);

  var namesJson = "[";
  for (var n = 0; n < names.length; n++) {
    if (n > 0) namesJson += ",";
    namesJson += '"' + names[n].replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }
  namesJson += "]";

  '{"names":' + namesJson + ',"count":' + names.length + '}';
})();

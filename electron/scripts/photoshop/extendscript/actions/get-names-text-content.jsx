/**
 * get-names-text-content.jsx — Names csoport text layerek nevenek es szoveges tartalmanak kiolvasasa
 *
 * Visszaadja a Names/Students es Names/Teachers artLayerek nevet es textContent-jet.
 * Kimenet (JSON string):
 *   { "items": [{ "layerName": "osztalyfonok_grabits_agota---31382", "textContent": "Grabits\rAgota" }, ...] }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

var __result = (function () {
  if (app.documents.length === 0) {
    return '{"items":[]}';
  }
  var doc = app.activeDocument;
  var items = [];

  function collectTextFromGroup(groupPath) {
    var grp = getGroupByPath(doc, groupPath);
    if (!grp) return;
    for (var i = 0; i < grp.artLayers.length; i++) {
      var layer = grp.artLayers[i];
      var textContent = "";
      try {
        if (layer.kind === LayerKind.TEXT) {
          textContent = layer.textItem.contents;
        }
      } catch (e) {
        // nem text layer vagy nem elerheto a textItem
      }
      items.push({ layerName: layer.name, textContent: textContent });
    }
  }

  collectTextFromGroup(["Names", "Students"]);
  collectTextFromGroup(["Names", "Teachers"]);

  // JSON szerialization (ES3 — nincs JSON.stringify!)
  var jsonItems = "[";
  for (var n = 0; n < items.length; n++) {
    if (n > 0) jsonItems += ",";
    var ln = items[n].layerName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    var tc = items[n].textContent.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    jsonItems += '{"layerName":"' + ln + '","textContent":"' + tc + '"}';
  }
  jsonItems += "]";

  return '{"items":' + jsonItems + '}';
})();
__result;

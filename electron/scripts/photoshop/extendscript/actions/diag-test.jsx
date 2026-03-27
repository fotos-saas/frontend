// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// Gyors diagnosztika: hany layer van, mennyi ido a select
var _start = new Date().getTime();
var doc = app.activeDocument;
var _layerCount = 0;

function _countLayers(container) {
  try { _layerCount += container.artLayers.length; } catch(e) {}
  try {
    for (var i = 0; i < container.layerSets.length; i++) {
      _countLayers(container.layerSets[i]);
    }
  } catch(e) {}
}
_countLayers(doc);

var _elapsed = new Date().getTime() - _start;
'{"layers":' + _layerCount + ',"countMs":' + _elapsed + ',"docName":"' + doc.name + '"}';

/**
 * utils.jsx — Kozos utility fuggvenyek ExtendScript-hez
 *
 * getGroupByPath()  — Csoport keresese utvonal alapjan
 * createTextLayer() — Szoveg layer letrehozasa
 * readJsonFile()    — JSON fajl beolvasasa (ExtendScript ES3 — nincs JSON.parse!)
 * parseArgs()       — Script argumentumok felolvasasa
 *
 * MEGJEGYZES: ExtendScript ES3 kornyezet — nincs JSON.parse(),
 * nincs Array.forEach(), nincs let/const. Minden var-ral es for ciklussal!
 *
 * FONTOS: Szamolasok, elnevezesek, sanitizeName → MINDIG az Electron handler
 * (Node.js) kesziti elo! A JSX CSAK a Photoshop DOM-ot manipulalja.
 */

// --- Csoport (LayerSet) keresese utvonal alapjan ---
// pl. getGroupByPath(doc, ["Names", "Students"]) → LayerSet vagy null
function getGroupByPath(doc, pathArray) {
  var current = doc;
  for (var i = 0; i < pathArray.length; i++) {
    var found = false;
    try {
      for (var j = 0; j < current.layerSets.length; j++) {
        if (current.layerSets[j].name === pathArray[i]) {
          current = current.layerSets[j];
          found = true;
          break;
        }
      }
    } catch (e) {
      return null;
    }
    if (!found) return null;
  }
  return current;
}

// --- Szoveg layer letrehozasa egy csoportban ---
// container: LayerSet, displayText: megjelenített szoveg, options: {name, font, size, color}
function createTextLayer(container, displayText, options) {
  var doc = app.activeDocument;

  // Layer letrehozasa a dokumentumban
  var textLayer = doc.artLayers.add();
  textLayer.kind = LayerKind.TEXT;
  textLayer.name = options.name || displayText;

  // Szoveg beallitas
  var textItem = textLayer.textItem;
  textItem.contents = displayText;
  textItem.font = options.font || CONFIG.FONT_NAME;
  textItem.size = new UnitValue(options.size || CONFIG.FONT_SIZE, "pt");

  // Szin
  var col = options.color || CONFIG.TEXT_COLOR;
  var solidColor = new SolidColor();
  solidColor.rgb.red = col.r;
  solidColor.rgb.green = col.g;
  solidColor.rgb.blue = col.b;
  textItem.color = solidColor;

  // Atrakás a cél csoportba
  textLayer.move(container, ElementPlacement.INSIDE);

  return textLayer;
}

// --- JSON fajl beolvasasa ---
// FONTOS: ExtendScript (ES3) kornyezetben NINCS JSON.parse() metodus!
// Az egyetlen mod JSON deserializalasra az eval().
// Ez BIZTONSAGOS ebben a kontextusban, mert:
//   1. A fajlt kizarolag az Electron main process generalja (temp fajl)
//   2. A tartalom strukturalt, elokeszitett adat (layerName, displayText, group)
//   3. A fajl soha nem szarmazik user inputbol kozvetlenul
//   4. A fajl a rendszer temp mappajaban van, nem publikus helyen
function readJsonFile(filePath) {
  var file = new File(filePath);
  if (!file.exists) {
    throw new Error("JSON fajl nem talalhato: " + filePath);
  }

  file.encoding = "UTF-8";
  file.open("r");
  var content = file.read();
  file.close();

  if (!content || content.length === 0) {
    throw new Error("JSON fajl ures: " + filePath);
  }

  // ExtendScript ES3: eval() az egyetlen JSON parse lehetoseg
  // eslint-disable-next-line no-eval
  var data;
  try {
    data = eval("(" + content + ")"); // NOSONAR — ExtendScript ES3, lasd fenti komment
  } catch (e) {
    throw new Error("JSON parse hiba: " + e.message);
  }

  return data;
}

// --- Script argumentumok felolvasasa ---
// Az osascript "do javascript" futtatáskor a DATA_FILE_PATH-ot
// a fő script elején állítjuk be CONFIG.DATA_FILE_PATH-ban.
function parseArgs() {
  var dataFilePath = null;

  // A CONFIG-bol olvassuk (a fo script allitja be)
  if (typeof CONFIG !== "undefined" && CONFIG.DATA_FILE_PATH) {
    dataFilePath = CONFIG.DATA_FILE_PATH;
  }

  return {
    dataFilePath: dataFilePath
  };
}

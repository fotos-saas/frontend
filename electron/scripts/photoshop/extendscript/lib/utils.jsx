/**
 * utils.jsx — Kozos utility fuggvenyek ExtendScript-hez
 *
 * getGroupByPath()  — Csoport keresese utvonal alapjan
 * createTextLayer() — Szoveg layer letrehozasa
 * readJsonFile()    — JSON fajl beolvasasa (ExtendScript ES3 — nincs JSON.parse!)
 * sanitizeName()    — Magyar ekezetmentes slug
 * parseArgs()       — Script argumentumok felolvasasa
 *
 * MEGJEGYZES: ExtendScript ES3 kornyezet — nincs JSON.parse(),
 * nincs Array.forEach(), nincs let/const. Minden var-ral es for ciklussal!
 */

// --- Magyar ekezetmentes slug ---
// pl. "Kiss János" + 42 → "kiss-janos---42"
function sanitizeName(name, personId) {
  var accents = {
    "\u00e1": "a", "\u00e9": "e", "\u00ed": "i", "\u00f3": "o", "\u00f6": "o", "\u0151": "o",
    "\u00fa": "u", "\u00fc": "u", "\u0171": "u",
    "\u00c1": "A", "\u00c9": "E", "\u00cd": "I", "\u00d3": "O", "\u00d6": "O", "\u0150": "O",
    "\u00da": "U", "\u00dc": "U", "\u0170": "U"
  };

  var result = "";
  for (var i = 0; i < name.length; i++) {
    var ch = name.charAt(i);
    result += accents[ch] ? accents[ch] : ch;
  }

  // Kisbetusites
  result = result.toLowerCase();

  // Nem alfanumerikus → kotojelre
  result = result.replace(/[^a-z0-9]+/g, "-");

  // Eleji/vegi kotojel eltavolitasa
  result = result.replace(/^-+|-+$/g, "");

  if (personId !== undefined && personId !== null) {
    result += "---" + String(personId);
  }

  return result;
}

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
//   2. A tartalom mindig strukturalt szemely-adat (id, name, type)
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

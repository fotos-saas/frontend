/**
 * utils.jsx — Kozos utility fuggvenyek ExtendScript-hez
 *
 * activateDocByName()           — Dokumentum aktivalasa nev alapjan (tobb PSD vedelem)
 * getGroupByPath()              — Csoport keresese utvonal alapjan
 * createTextLayer()             — Szoveg layer letrehozasa
 * createSmartObjectPlaceholder() — Smart Object placeholder layer letrehozasa
 * placePhotoInSmartObject()     — SO megnyitas → kep Place → cover → mentes → bezaras
 * readJsonFile()                — JSON fajl beolvasasa (ExtendScript ES3 — nincs JSON.parse!)
 * parseArgs()                   — Script argumentumok felolvasasa
 *
 * MEGJEGYZES: ExtendScript ES3 kornyezet — nincs JSON.parse(),
 * nincs Array.forEach(), nincs let/const. Minden var-ral es for ciklussal!
 *
 * FONTOS: Szamolasok, elnevezesek, sanitizeName → MINDIG az Electron handler
 * (Node.js) kesziti elo! A JSX CSAK a Photoshop DOM-ot manipulalja.
 */

// --- Dokumentum aktivalasa nev alapjan ---
// Tobb nyitott PSD eseten a CONFIG.TARGET_DOC_NAME alapjan
// kivalasztja a megfelelo dokumentumot.
// Ha nincs TARGET_DOC_NAME → az aktualis aktiv dokumentumot hasznalja.
// FONTOS: az SO megnyitas/bezaras megvaltoztatja az activeDocument-et,
// ezert minden muvelet elott es az SO bezarasa utan is hivni kell!
function activateDocByName(targetName) {
  if (!targetName) return app.activeDocument;

  for (var i = 0; i < app.documents.length; i++) {
    if (app.documents[i].name === targetName) {
      app.activeDocument = app.documents[i];
      return app.documents[i];
    }
  }
  // Ha nem talaljuk, marad az aktiv — ne dobjunk hibat
  return app.activeDocument;
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

// --- Smart Object placeholder layer letrehozasa ---
// Letrehoz egy ures layert, majd ActionManager-rel Smart Object-te alakitja.
// container: LayerSet, options: {name, widthPx, heightPx}
function createSmartObjectPlaceholder(doc, container, options) {
  // Ures layer letrehozasa
  var layer = doc.artLayers.add();
  layer.name = options.name;

  // Kitoltes szurke szinnel (placeholder kep — lathatova teszi a layert)
  var fillColor = new SolidColor();
  fillColor.rgb.red = 200;
  fillColor.rgb.green = 200;
  fillColor.rgb.blue = 200;

  // Szelekcioval toltjuk ki a megadott meretre (bal felso sarok)
  var selRegion = [
    [0, 0],
    [options.widthPx, 0],
    [options.widthPx, options.heightPx],
    [0, options.heightPx]
  ];
  doc.selection.select(selRegion);
  doc.selection.fill(fillColor);
  doc.selection.deselect();

  // Layer atrakeasa a cel csoportba
  layer.move(container, ElementPlacement.INSIDE);

  // Biztositjuk hogy a layer aktiv legyen a Convert to SO elott
  // (a move() neha megvaltoztatja az aktiv layert)
  doc.activeLayer = layer;

  // Smart Object-te alakitas ActionManager-rel
  // Ez a Photoshop belso "Convert to Smart Object" parancsa
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putClass(stringIDToTypeID("smartObject"));
  desc.putReference(charIDToTypeID("null"), ref);
  var refLayer = new ActionReference();
  refLayer.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("Usng"), refLayer);
  executeAction(stringIDToTypeID("newPlacedLayer"), desc, DialogModes.NO);

  return layer;
}

// --- Smart Object megnyitasa, kep behelyezese, mentes + bezaras ---
// A helyes flow:
//   1. SO megnyitasa (editContents) → kulon dokumentum nyilik az SO meretevel
//   2. Kep Place-elese az SO dokumentumba (File > Place Embedded)
//   3. Kep atmeretezese hogy kitoltse az SO-t (cover logika)
//   4. Mentes + Bezaras → visszakerul a fo PSD-be
// photoPath: a lokalis kepfajl TELJES utvonala (a handler tolti le)
function placePhotoInSmartObject(doc, layer, photoPath) {
  // Layer aktiv legyen
  doc.activeLayer = layer;

  // 1. Smart Object megnyitasa szerkesztesre
  //    ActionManager: editContents (dupla klikk az SO-ra)
  var descEdit = new ActionDescriptor();
  var refEdit = new ActionReference();
  refEdit.putEnumerated(
    stringIDToTypeID("smartObject"),
    stringIDToTypeID("ordinal"),
    stringIDToTypeID("targetEnum")
  );
  descEdit.putReference(charIDToTypeID("null"), refEdit);
  executeAction(stringIDToTypeID("placedLayerEditContents"), descEdit, DialogModes.NO);

  // Most az SO belso dokumentuma az aktiv
  var soDoc = app.activeDocument;
  var soWidth = soDoc.width.as("px");
  var soHeight = soDoc.height.as("px");

  // 2. Kep behelyezese Place Embedded-del
  var descPlace = new ActionDescriptor();
  descPlace.putPath(charIDToTypeID("null"), new File(photoPath));
  descPlace.putEnumerated(
    charIDToTypeID("FTcs"),
    charIDToTypeID("QCSt"),
    charIDToTypeID("Qcsa")  // Fit
  );
  // Offset nullazas (kozepre kerul)
  descPlace.putUnitDouble(charIDToTypeID("Ofst"), charIDToTypeID("#Pxl"), 0);
  descPlace.putUnitDouble(charIDToTypeID("OfsY"), charIDToTypeID("#Pxl"), 0);
  executeAction(stringIDToTypeID("placeEvent"), descPlace, DialogModes.NO);

  // A Place utan a kep meg transform modban van — commit-oljuk
  // A behelyezett layer most az activeLayer
  var placedLayer = soDoc.activeLayer;

  // 3. Cover logika: atmeretezni hogy kitoltse az SO-t (nincs ures terulet)
  //    A Place "Fit" modban a kisebb oldalra illeszti, nekunk a nagyobbra kell
  var placedBounds = placedLayer.bounds;
  var placedW = placedBounds[2].as("px") - placedBounds[0].as("px");
  var placedH = placedBounds[3].as("px") - placedBounds[1].as("px");

  if (placedW > 0 && placedH > 0) {
    var scaleX = (soWidth / placedW) * 100;
    var scaleY = (soHeight / placedH) * 100;
    var scaleFactor = Math.max(scaleX, scaleY); // cover = nagyobb skala

    if (Math.abs(scaleFactor - 100) > 0.5) {
      placedLayer.resize(scaleFactor, scaleFactor, AnchorPosition.MIDDLECENTER);
    }

    // Kozepre igazitas
    var newBounds = placedLayer.bounds;
    var newW = newBounds[2].as("px") - newBounds[0].as("px");
    var newH = newBounds[3].as("px") - newBounds[1].as("px");
    var offsetX = (soWidth - newW) / 2 - newBounds[0].as("px");
    var offsetY = (soHeight - newH) / 2 - newBounds[1].as("px");
    placedLayer.translate(new UnitValue(offsetX, "px"), new UnitValue(offsetY, "px"));
  }

  // 4. Flatten (egyetlen layer legyen az SO-ban)
  soDoc.flatten();

  // 5. Mentes + Bezaras (Ctrl+S, Ctrl+W)
  soDoc.save();
  soDoc.close(SaveOptions.DONOTSAVECHANGES); // mar mentettuk
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

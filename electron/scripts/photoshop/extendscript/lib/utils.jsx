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
  // Ha nincs egyetlen dokumentum se, megprobaljuk megnyitni a PSD_FILE_PATH-bol
  if (app.documents.length === 0) {
    if (CONFIG.PSD_FILE_PATH) {
      var fInit = new File(CONFIG.PSD_FILE_PATH);
      if (fInit.exists) {
        var openedInit = app.open(fInit);
        app.activeDocument = openedInit;
        return openedInit;
      }
    }
    throw new Error("Nincs megnyitott dokumentum es nincs PSD_FILE_PATH!");
  }

  if (!targetName) return app.activeDocument;

  for (var i = 0; i < app.documents.length; i++) {
    if (app.documents[i].name === targetName) {
      app.activeDocument = app.documents[i];
      return app.documents[i];
    }
  }

  // Nem talaltuk nev alapjan — megprobaljuk megnyitni a PSD_FILE_PATH-bol
  if (CONFIG.PSD_FILE_PATH) {
    var f = new File(CONFIG.PSD_FILE_PATH);
    if (f.exists) {
      var opened = app.open(f);
      app.activeDocument = opened;
      return opened;
    }
  }

  // Fallback: marad az aktiv
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

  // Igazitas (left/center/right)
  if (options.alignment) {
    var alignMap = { left: Justification.LEFT, center: Justification.CENTER, right: Justification.RIGHT };
    if (alignMap[options.alignment]) {
      textItem.justification = alignMap[options.alignment];
    }
  }

  // Atrakás a cél csoportba
  textLayer.move(container, ElementPlacement.INSIDE);

  return textLayer;
}

// --- Smart Object placeholder layer letrehozasa ---
// Letrehoz egy ures layert, majd ActionManager-rel Smart Object-te alakitja.
// container: LayerSet, options: {name, widthPx, heightPx}
function createSmartObjectPlaceholder(doc, container, options) {
  // Layer letrehozasa a doc gyokeren
  var layer = doc.artLayers.add();
  layer.name = options.name;

  // Kitoltes szurke szinnel
  var fillColor = new SolidColor();
  fillColor.rgb.red = 200;
  fillColor.rgb.green = 200;
  fillColor.rgb.blue = 200;
  var selRegion = [
    [0, 0],
    [options.widthPx, 0],
    [options.widthPx, options.heightPx],
    [0, options.heightPx]
  ];
  doc.selection.select(selRegion);
  doc.selection.fill(fillColor);
  doc.selection.deselect();

  // Atrakás a cel csoportba
  layer.move(container, ElementPlacement.INSIDE);
  doc.activeLayer = layer;

  // Convert to Smart Object — a newPlacedLayer erzekeny a displayDialogs allapotra.
  // Ideiglenesen visszaallitjuk az eredeti dialogus modot (ahogy eredetileg mukodott),
  // hogy a PS ne ejtse ki a layert a csoportbol.
  var _prevDialogs = app.displayDialogs;
  app.displayDialogs = DialogModes.ERROR;
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(stringIDToTypeID("smartObject"));
    desc.putReference(charIDToTypeID("null"), ref);
    var refLayer = new ActionReference();
    refLayer.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("Usng"), refLayer);
    executeAction(stringIDToTypeID("newPlacedLayer"), desc, DialogModes.NO);
  } finally {
    app.displayDialogs = _prevDialogs;
  }

  return doc.activeLayer;
}

// --- Smart Object megnyitasa, kep behelyezese, mentes + bezaras ---
// A helyes flow:
//   1. SO megnyitasa (editContents) → kulon dokumentum nyilik az SO meretevel
//   2. Kep Place-elese az SO dokumentumba (File > Place Embedded)
//   3. Kep atmeretezese hogy kitoltse az SO-t (cover logika)
//   4. Mentes + Bezaras → visszakerul a fo PSD-be
// photoPath: a lokalis kepfajl TELJES utvonala (a handler tolti le)
function placePhotoInSmartObject(doc, layer, photoPath, syncBorder) {
  var _origDialogs = app.displayDialogs;
  app.displayDialogs = DialogModes.NO;

  doc.activeLayer = layer;

  // 1. SO megnyitas
  var descEdit = new ActionDescriptor();
  var refEdit = new ActionReference();
  refEdit.putEnumerated(stringIDToTypeID("smartObject"), stringIDToTypeID("ordinal"), stringIDToTypeID("targetEnum"));
  descEdit.putReference(charIDToTypeID("null"), refEdit);
  executeAction(stringIDToTypeID("placedLayerEditContents"), descEdit, DialogModes.NO);

  var soDoc = app.activeDocument;
  var soWidth = soDoc.width.as("px");
  var soHeight = soDoc.height.as("px");

  // 2. Place Embedded
  var descPlace = new ActionDescriptor();
  descPlace.putPath(charIDToTypeID("null"), new File(photoPath));
  descPlace.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
  descPlace.putUnitDouble(charIDToTypeID("Ofst"), charIDToTypeID("#Pxl"), 0);
  descPlace.putUnitDouble(charIDToTypeID("OfsY"), charIDToTypeID("#Pxl"), 0);
  executeAction(stringIDToTypeID("placeEvent"), descPlace, DialogModes.NO);

  // 3. Cover resize + kozepre
  var placedLayer = soDoc.activeLayer;
  var pb = placedLayer.bounds;
  var pW = pb[2].as("px") - pb[0].as("px");
  var pH = pb[3].as("px") - pb[1].as("px");

  if (pW > 0 && pH > 0) {
    var sf = Math.max((soWidth / pW) * 100, (soHeight / pH) * 100);
    if (Math.abs(sf - 100) > 0.5) {
      placedLayer.resize(sf, sf, AnchorPosition.MIDDLECENTER);
    }
    var nb = placedLayer.bounds;
    placedLayer.translate(
      new UnitValue((soWidth - (nb[2].as("px") - nb[0].as("px"))) / 2 - nb[0].as("px"), "px"),
      new UnitValue((soHeight - (nb[3].as("px") - nb[1].as("px"))) / 2 - nb[1].as("px"), "px")
    );
  }

  // 4. Keretezes (opcionalis)
  if (syncBorder) {
    try {
      var _aRef = new ActionReference();
      _aRef.putName(stringIDToTypeID("actionSet"), "tablo_common");
      executeActionGet(_aRef);
      app.doAction("tker_without_save", "tablo_common");
    } catch (e) {}
  }

  // 5. Flatten + Save + Close
  soDoc.flatten();
  soDoc.save();
  soDoc.close(SaveOptions.DONOTSAVECHANGES);

  app.displayDialogs = _origDialogs;
}

// --- Layer kivalasztasa ID alapjan (ActionManager) ---
// Megbizhato layer kivalasztas, fuggetlen az activeLayer allapottol.
// A Photoshop DOM layer.id egyedi azonosito, ami nem valtozik move/rename utan sem.
function selectLayerById(layerId) {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerId);
  desc.putReference(charIDToTypeID("null"), ref);
  desc.putBoolean(charIDToTypeID("MkVs"), false); // NE scrollozzon a Layers panelen → gyorsabb
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}

// --- BATCH: Tobb layer kivalasztasa ---
// Az elso layert select-tel, a tobbit addToSelectionnel jeloli ki.
// layerIds: tomb (number[]) — a layer.id ertekek
function selectMultipleLayersById(layerIds) {
  if (!layerIds || layerIds.length === 0) return;
  if (layerIds.length === 1) { selectLayerById(layerIds[0]); return; }

  // Elso layer kivalasztasa
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID("Lyr "), layerIds[0]);
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);

  // Tobbi hozzaadasa egyenkent
  for (var i = 1; i < layerIds.length; i++) {
    var addDesc = new ActionDescriptor();
    var addRef = new ActionReference();
    addRef.putIdentifier(charIDToTypeID("Lyr "), layerIds[i]);
    addDesc.putReference(charIDToTypeID("null"), addRef);
    addDesc.putEnumerated(
      stringIDToTypeID("selectionModifier"),
      stringIDToTypeID("selectionModifierType"),
      stringIDToTypeID("addToSelection")
    );
    executeAction(charIDToTypeID("slct"), addDesc, DialogModes.NO);
  }
}

// --- Csoport osszes artLayer-jenek atmeretezese ---
// A regi tablokiraly set-image-size.jsx mintajara: vegigmegy a csoport layerein,
// selectLayerById-vel kivalasztja, majd resize-olja a cel szelessegre.
// targetWidthPx: cel szelesseg pixelben (aspect ratio megtartasaval)
function resizeGroupLayers(doc, groupPath, targetWidthPx) {
  var grp = getGroupByPath(doc, groupPath);
  if (!grp) return 0;

  var resized = 0;
  for (var i = 0; i < grp.artLayers.length; i++) {
    var layer = grp.artLayers[i];
    try {
      // Layer kivalasztasa ID alapjan (megbizhato)
      selectLayerById(layer.id);
      doc.activeLayer = layer;

      var bounds = layer.bounds;
      var currentW = bounds[2].as("px") - bounds[0].as("px");
      var currentH = bounds[3].as("px") - bounds[1].as("px");

      if (currentW <= 0) continue;

      // Aranyos meretezes
      var scaleW = (targetWidthPx / currentW) * 100;
      var ratio = currentH / currentW;
      var targetH = targetWidthPx * ratio;
      var scaleH = (targetH / currentH) * 100;

      // Csak ha tenyleg kell meretezni (1px tolerancia)
      if (Math.abs(currentW - targetWidthPx) > 1) {
        layer.resize(scaleW, scaleH, AnchorPosition.MIDDLECENTER);
        resized++;
      }
    } catch (e) {
      // skip — a hivo logol
    }
  }
  return resized;
}

// --- cm → px konverzio a dokumentum DPI-jevel ---
// Kerekites NELKUL, hogy a hivo donthessen a kerekitesrol.
function cmToPx(cm, dpi) {
  return (cm / 2.54) * dpi;
}

// --- Layer pozicio nullazasa (origoba mozgatas) ---
// A layer bounds alapjan kiszamolja mennyit kell mozditani,
// hogy a bal felso sarka a dokumentum origojaba (0,0) keruljon.
// FONTOS: pixelben dolgozunk a kerekitesi hibak elkerulesehez!
function resetLayerPosition(layer) {
  var bounds = layer.bounds;
  var dx = -bounds[0].as("px");
  var dy = -bounds[1].as("px");
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    layer.translate(new UnitValue(Math.round(dx), "px"), new UnitValue(Math.round(dy), "px"));
  }
}

// --- Layer pozicionalasa cm-ben (pixelre kerekitve) ---
// Elobb resetLayerPosition()-nel nullazzuk, majd ide mozgatjuk.
// leftCm, topCm: cel pozicio a dokumentum bal felso sarkatol cm-ben.
// dpi: a dokumentum DPI-je (app.activeDocument.resolution)
function positionLayerCm(layer, leftCm, topCm, dpi) {
  var dx = Math.round(cmToPx(leftCm, dpi));
  var dy = Math.round(cmToPx(topCm, dpi));
  layer.translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
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


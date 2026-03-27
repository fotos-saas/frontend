/**
 * config.jsx — Kozos beallitasok ExtendScript-hez
 *
 * Font, meret, szin konfiguracio a text layer-ekhez.
 * Minden action script #include-olja ezt.
 */

// PSD/PSB tomoritest kikapcsolasa — 10-20x gyorsabb save!
// A PS alapbol tomoritve menti (egyetlen CPU mag vegzi), ami 277MB+ fajlnal
// a fo bottleneck. Kikapcsolva a fajlmeret nagyobb, de a mentes pillanatok alatt megy.
// Forras: https://community.adobe.com/t5/photoshop/photoshop-javascript-scripting-preferences-psd-psb-compression/m-p/10780202
try {
  var _prefDesc = new ActionDescriptor();
  var _prefRef = new ActionReference();
  _prefRef.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("fileSavePrefs"));
  _prefRef.putEnumerated(charIDToTypeID("capp"), charIDToTypeID("OrDn"), charIDToTypeID("Trgt"));
  _prefDesc.putReference(charIDToTypeID("null"), _prefRef);
  var _savePrefs = new ActionDescriptor();
  _savePrefs.putBoolean(stringIDToTypeID("disablePSDCompression"), true);
  _prefDesc.putObject(stringIDToTypeID("T   "), stringIDToTypeID("fileSavePrefs"), _savePrefs);
  executeAction(charIDToTypeID("setd"), _prefDesc, DialogModes.NO);
} catch (e) { /* regi PS verzio nem tamogatja — nem baj */ }

// Dialogusok elnyomasa a script futasa alatt — megakadalyozza a
// "New Group", "Duplicate Image", stb. felugro ablakokat.
// A JsxRunnerService a script VEGEN automatikusan visszaallitja.
var _savedDialogMode = app.displayDialogs;
app.displayDialogs = DialogModes.NO;

var CONFIG = {
  // Szoveg layer alapertelmezes
  FONT_NAME: "ArialMT",
  FONT_SIZE: 25,           // pontmeret (pt)
  TEXT_COLOR: { r: 0, g: 0, b: 0 },

  // JSON temp fajl — ha nincs explicit megadva, az args-bol jon
  // (Ez placeholder, az action script allitja be a tényleges útvonalat)
  DATA_FILE_PATH: null,

  // Cel PSD dokumentum neve (pl. "projekt-12a.psd")
  // Ha meg van adva, a script NEV alapjan aktivalja a dokumentumot
  // → tobb nyitott PSD eseten is mindig a helyesben dolgozik
  TARGET_DOC_NAME: null,

  // Pozicio (beosztás) text layer beallitasok
  POSITION_FONT_SIZE: 18,      // pontmeret (pt) — kisebb mint a 25pt nev
  POSITION_GAP_CM: 0.15,       // gap a nev alja es pozicio teteje kozott (cm)

  // PSD fajl teljes eleresi utja (autoOpen-hez)
  // Ha a TARGET_DOC_NAME nincs megnyitva, innen nyitja meg automatikusan
  PSD_FILE_PATH: null,

  // Keretezés — ha "true", a place-photos.jsx app.doAction("tker_without_save", "tablo_common") fut
  SYNC_BORDER: null
};

/**
 * refresh-name-texts.jsx — Nev layerek szovegenek frissitese DB-bol
 *
 * CSAK a textItem.contents-et irja felul, NEM pozicional!
 * A nev tordeleset (breakName) alkalmazza ha BREAK_AFTER > 0.
 *
 * CONFIG parameterei:
 *   CONFIG.NAME_MAP = JSON object string {"layerName":"DB nev",...} (KOTELEZO)
 *   CONFIG.TARGET_GROUP = "all" | "students" | "teachers" (default: "all")
 *   CONFIG.BREAK_AFTER = szam (default: 0 — nincs sortores)
 *
 * Kimenet: JSON { "refreshed": 5, "nameMapCount": 25 }
 */

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Egyszeru JSON object parser (ES3, nincs JSON.parse) ---
function parseSimpleJsonObject(str) {
  var obj = {};
  if (!str || str.length < 2) return obj;
  str = str.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  if (str.length === 0) return obj;
  var re = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  var match;
  while ((match = re.exec(str)) !== null) {
    var key = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    var val = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    obj[key] = val;
  }
  return obj;
}

// --- Nev tordeles (breakName) ---
function breakName(name, breakAfter) {
  if (breakAfter <= 0) return name;
  var words = name.split(" ");
  if (words.length < 2) return name;
  function isPrefix(w) { return w.replace(/\./g, "").length <= 2; }
  var realCount = 0;
  for (var c = 0; c < words.length; c++) {
    if (!isPrefix(words[c])) realCount++;
  }
  // Kotojelnel: ha van kotojeles szo es legalabb 2 szo van, torjuk a kotojel utan
  var hyphenIndex = -1;
  for (var h = 0; h < words.length; h++) {
    if (words[h].indexOf("-") !== -1) { hyphenIndex = h; break; }
  }
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(" ") + "\r" + words.slice(hyphenIndex + 1).join(" ");
  }
  if (realCount < 3) return name;
  var breakAt = breakAfter;
  if (breakAt >= words.length) return name;
  return words.slice(0, breakAt).join(" ") + "\r" + words.slice(breakAt).join(" ");
}

// --- JSON escape (ES3) ---
function escapeJsonStr(s) {
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/"/g, '\\"');
  s = s.replace(/\n/g, '\\n');
  s = s.replace(/\r/g, '\\r');
  s = s.replace(/\t/g, '\\t');
  return s;
}

var _refreshResult = '{"refreshed":0}';

function doRefreshNameTexts() {
  var doc = app.activeDocument;

  var breakAfter = typeof CONFIG !== "undefined" && CONFIG.BREAK_AFTER ? parseInt(CONFIG.BREAK_AFTER, 10) : 0;
  var targetGroupRaw = typeof CONFIG !== "undefined" && CONFIG.TARGET_GROUP ? CONFIG.TARGET_GROUP : "all";
  var targetGroup = targetGroupRaw.toLowerCase();

  // NAME_MAP parse
  var nameMap = null;
  var nameMapCount = 0;
  if (typeof CONFIG !== "undefined" && CONFIG.NAME_MAP && CONFIG.NAME_MAP !== "") {
    nameMap = parseSimpleJsonObject(CONFIG.NAME_MAP);
    for (var k in nameMap) { if (nameMap.hasOwnProperty(k)) nameMapCount++; }
  }

  if (!nameMap || nameMapCount === 0) {
    _refreshResult = '{"refreshed":0,"error":"Nincs NAME_MAP adat"}';
    return;
  }

  // Name layerek osszegyujtese (TARGET_GROUP alapjan)
  var nameLayers = [];
  if (targetGroup === "students") {
    var sGrp = getGroupByPath(doc, ["Names", "Students"]);
    if (sGrp) { for (var si = 0; si < sGrp.artLayers.length; si++) nameLayers.push(sGrp.artLayers[si]); }
  } else if (targetGroup === "teachers") {
    var tGrp = getGroupByPath(doc, ["Names", "Teachers"]);
    if (tGrp) { for (var ti = 0; ti < tGrp.artLayers.length; ti++) nameLayers.push(tGrp.artLayers[ti]); }
  } else {
    var groups = [["Names", "Students"], ["Names", "Teachers"]];
    for (var g = 0; g < groups.length; g++) {
      var grp = getGroupByPath(doc, groups[g]);
      if (!grp) continue;
      for (var i = 0; i < grp.artLayers.length; i++) {
        nameLayers.push(grp.artLayers[i]);
      }
    }
  }

  var refreshed = 0;
  var skipped = 0;
  var noMatch = 0;
  var debugNames = [];
  for (var j = 0; j < nameLayers.length; j++) {
    var nl = nameLayers[j];
    var dbName = nameMap[nl.name];
    if (!dbName) {
      noMatch++;
      if (debugNames.length < 5) debugNames.push(escapeJsonStr(nl.name));
      continue;
    }

    try {
      var textItem = nl.textItem;
      var newText = breakName(dbName, breakAfter);
      // Sortores-mentes osszehasonlitas: csak a tényleges szoveg valtozast nezzuk
      var oldPlain = textItem.contents.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
      var newPlain = newText.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
      if (oldPlain !== newPlain) {
        textItem.contents = newText;
        refreshed++;
      } else {
        skipped++;
      }
    } catch (e) {
      // nem text layer — skip
    }
  }

  var debugStr = debugNames.length > 0 ? ',"debugNoMatch":["' + debugNames.join('","') + '"]' : '';
  _refreshResult = '{"refreshed":' + refreshed + ',"nameMapCount":' + nameMapCount + ',"total":' + nameLayers.length + ',"noMatch":' + noMatch + ',"skipped":' + skipped + debugStr + '}';
}

try {
  if (app.documents.length > 0) {
    app.activeDocument.suspendHistory("Refresh name texts", "doRefreshNameTexts()");
  }
} catch (e) {
  _refreshResult = '{"refreshed":0,"error":"' + escapeJsonStr(e.message) + '"}';
}

_refreshResult;

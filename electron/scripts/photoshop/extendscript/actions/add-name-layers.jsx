/**
 * add-name-layers.jsx — Személynevek text layerek hozzáadása a megnyitott PSD-hez
 *
 * Elvárt mappastruktúra a PSD-ben (Python generálja):
 *   Names/Students/  — diákok text layerei
 *   Names/Teachers/  — tanárok text layerei
 *
 * Input: JSON temp fájl (CONFIG.DATA_FILE_PATH — az Electron handler állítja be)
 * JSON formátum: [{ "id": 42, "name": "Kiss János", "type": "student" }, ...]
 *
 * Futtatás: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript file ...'
 *
 * FONTOS: Photoshop "do javascript file" módban a writeln() NEM elerheto!
 * A log uzeneteket egy bufferbe gyujtjuk es a script vegen stringkent adjuk vissza.
 * Az osascript stdout-ra az utolso kifejezes erteke kerul.
 */

// A CONFIG.DATA_FILE_PATH-ot a hivo script dinamikusan allitja be
// a #include elott (lasd: photoshop.handler.ts buildJsxScript fuggveny)

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

// --- Log buffer (writeln() helyett) ---
var _logLines = [];
function log(msg) {
  _logLines.push(msg);
}

(function () {
  // --- Eredmeny szamlalok ---
  var stats = {
    students: 0,
    teachers: 0,
    errors: 0
  };

  try {
    // --- 1. Aktiv dokumentum ellenorzes ---
    if (!app.documents.length) {
      throw new Error("Nincs megnyitott dokumentum! Elobb nyisd meg a PSD-t.");
    }
    var doc = app.activeDocument;
    log("[JSX] Dokumentum: " + doc.name + " (" + doc.width + " x " + doc.height + ")");

    // --- 2. JSON temp fajl beolvasasa ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH! A CONFIG.DATA_FILE_PATH beallitasa szukseges.");
    }

    log("[JSX] JSON fajl: " + args.dataFilePath);
    var persons = readJsonFile(args.dataFilePath);

    if (!persons || persons.length === 0) {
      log("[JSX] Nincs szemely adat — kilep.");
      log("[JSX] KESZ: 0 diak, 0 tanar, 0 hiba");
      return _logLines.join("\n");
    }

    log("[JSX] Szemelyek szama: " + persons.length);

    // --- 3. Szétválogatás: diákok és tanárok ---
    var students = [];
    var teachers = [];
    for (var i = 0; i < persons.length; i++) {
      if (persons[i].type === "teacher") {
        teachers.push(persons[i]);
      } else {
        students.push(persons[i]);
      }
    }

    log("[JSX] Diakok: " + students.length + ", Tanarok: " + teachers.length);

    // --- 4. Names/Students csoport keresese ---
    var studentsGroup = getGroupByPath(doc, ["Names", "Students"]);
    if (!studentsGroup) {
      log("[JSX] HIBA: Names/Students csoport nem talalhato!");
      stats.errors++;
    } else {
      log("[JSX] Names/Students csoport megtalalva");

      // Diak text layerek letrehozasa
      for (var s = 0; s < students.length; s++) {
        try {
          var student = students[s];
          var layerName = sanitizeName(student.name, student.id);
          createTextLayer(studentsGroup, student.name, {
            name: layerName,
            font: CONFIG.FONT_NAME,
            size: CONFIG.FONT_SIZE,
            color: CONFIG.TEXT_COLOR
          });
          stats.students++;
        } catch (e) {
          log("[JSX] HIBA diak layer (" + student.name + "): " + e.message);
          stats.errors++;
        }
      }

      log("[JSX] " + stats.students + "/" + students.length + " diak layer letrehozva");
    }

    // --- 5. Names/Teachers csoport keresese ---
    var teachersGroup = getGroupByPath(doc, ["Names", "Teachers"]);
    if (!teachersGroup) {
      log("[JSX] HIBA: Names/Teachers csoport nem talalhato!");
      stats.errors++;
    } else {
      log("[JSX] Names/Teachers csoport megtalalva");

      // Tanar text layerek letrehozasa
      for (var t = 0; t < teachers.length; t++) {
        try {
          var teacher = teachers[t];
          var tLayerName = sanitizeName(teacher.name, teacher.id);
          createTextLayer(teachersGroup, teacher.name, {
            name: tLayerName,
            font: CONFIG.FONT_NAME,
            size: CONFIG.FONT_SIZE,
            color: CONFIG.TEXT_COLOR
          });
          stats.teachers++;
        } catch (e) {
          log("[JSX] HIBA tanar layer (" + teacher.name + "): " + e.message);
          stats.errors++;
        }
      }

      log("[JSX] " + stats.teachers + "/" + teachers.length + " tanar layer letrehozva");
    }

    // --- 6. Eredmeny ---
    log("[JSX] KESZ: " + stats.students + " diak, " + stats.teachers + " tanar, " + stats.errors + " hiba");

  } catch (e) {
    log("[JSX] HIBA: " + e.message);
    log("[JSX] KESZ: " + stats.students + " diak, " + stats.teachers + " tanar, " + (stats.errors + 1) + " hiba");
  }
})();

// Az utolso kifejezes erteke kerul az osascript stdout-ra
_logLines.join("\n");

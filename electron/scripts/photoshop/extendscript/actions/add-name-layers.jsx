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
 * Futtatás: osascript -e 'tell app id "com.adobe.Photoshop" to do javascript ...'
 */

// A CONFIG.DATA_FILE_PATH-ot a hivo script dinamikusan allitja be
// a #include elott (lasd: photoshop.handler.ts runJsxScript fuggveny)

// #include "../lib/config.jsx"
// #include "../lib/utils.jsx"

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
    writeln("[JSX] Dokumentum: " + doc.name + " (" + doc.width + " x " + doc.height + ")");

    // --- 2. JSON temp fajl beolvasasa ---
    var args = parseArgs();
    if (!args.dataFilePath) {
      throw new Error("Nincs megadva DATA_FILE_PATH! A CONFIG.DATA_FILE_PATH beallitasa szukseges.");
    }

    writeln("[JSX] JSON fajl: " + args.dataFilePath);
    var persons = readJsonFile(args.dataFilePath);

    if (!persons || persons.length === 0) {
      writeln("[JSX] Nincs szemely adat — kilep.");
      writeln("[JSX] KESZ: 0 diak, 0 tanar, 0 hiba");
      return;
    }

    writeln("[JSX] Szemelyek szama: " + persons.length);

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

    writeln("[JSX] Diakok: " + students.length + ", Tanarok: " + teachers.length);

    // --- 4. Names/Students csoport keresese ---
    var studentsGroup = getGroupByPath(doc, ["Names", "Students"]);
    if (!studentsGroup) {
      writeln("[JSX] HIBA: Names/Students csoport nem talalhato!");
      stats.errors++;
    } else {
      writeln("[JSX] Names/Students csoport megtalalva");

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
          writeln("[JSX] HIBA diak layer (" + student.name + "): " + e.message);
          stats.errors++;
        }
      }

      writeln("[JSX] " + stats.students + "/" + students.length + " diak layer letrehozva");
    }

    // --- 5. Names/Teachers csoport keresese ---
    var teachersGroup = getGroupByPath(doc, ["Names", "Teachers"]);
    if (!teachersGroup) {
      writeln("[JSX] HIBA: Names/Teachers csoport nem talalhato!");
      stats.errors++;
    } else {
      writeln("[JSX] Names/Teachers csoport megtalalva");

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
          writeln("[JSX] HIBA tanar layer (" + teacher.name + "): " + e.message);
          stats.errors++;
        }
      }

      writeln("[JSX] " + stats.teachers + "/" + teachers.length + " tanar layer letrehozva");
    }

    // --- 6. Eredmeny ---
    writeln("[JSX] KESZ: " + stats.students + " diak, " + stats.teachers + " tanar, " + stats.errors + " hiba");

  } catch (e) {
    writeln("[JSX] HIBA: " + e.message);
    writeln("[JSX] KESZ: " + stats.students + " diak, " + stats.teachers + " tanar, " + (stats.errors + 1) + " hiba");
  }
})();

/**
 * PhotoStack Timer Bridge — Photoshop ExtendScript
 *
 * Automatikus timer start/stop fájl megnyitás/bezárás alapján.
 * Telepítés: helyezd a Photoshop Scripts mappába vagy töltsd be startup scriptként.
 *
 * Konfiguráció: a PHOTOSTACK_API és API_TOKEN értékeket állítsd be
 * a PhotoStack Electron alkalmazásból (IPC-vel küldött config).
 */

// @ts-nocheck
// #target photoshop

var PHOTOSTACK_API = "https://api.tablostudio.hu/api/partner";
var API_TOKEN = ""; // Sanctum token — Electron-ből töltődik

var activeTimerProjectCode = null;

/**
 * Fájl megnyitás eseményre: timer indítás.
 */
function photostackOnOpen() {
    try {
        if (!app.activeDocument) return;

        var doc = app.activeDocument;
        var filename = doc.name.replace(/\.[^.]+$/, "");
        var projectCode = extractProjectCode(filename);

        if (!projectCode || projectCode === activeTimerProjectCode) return;

        // Előző timer leállítása
        if (activeTimerProjectCode) {
            httpPost(PHOTOSTACK_API + "/timers/stop-by-project", {
                project_code: activeTimerProjectCode
            });
        }

        // Új timer indítása
        httpPost(PHOTOSTACK_API + "/timers/start-by-filename", {
            filename: filename,
            project_code: projectCode
        });

        activeTimerProjectCode = projectCode;
    } catch (e) {
        // Silent fail — nem szabad megszakítani a Photoshop workflow-t
    }
}

/**
 * Fájl bezárás eseményre: timer stop ha nincs más dokumentum.
 */
function photostackOnClose() {
    try {
        if (app.documents.length <= 1 && activeTimerProjectCode) {
            httpPost(PHOTOSTACK_API + "/timers/stop-by-project", {
                project_code: activeTimerProjectCode
            });
            activeTimerProjectCode = null;
        }
    } catch (e) {
        // Silent fail
    }
}

/**
 * Projekt kód kinyerése fájlnévből.
 * "PS-142_v1" → "PS-142"
 * "szechenyi_12a_v3" → "szechenyi 12a"
 */
function extractProjectCode(filename) {
    var match = filename.match(/PS-(\d+)/i);
    if (match) return "PS-" + match[1];

    return filename.replace(/_v\d+$/i, "").replace(/_/g, " ");
}

/**
 * HTTP POST kérés — platform-specifikus megvalósítás.
 */
function httpPost(url, data) {
    var json = JSON.stringify(data);

    if ($.os.indexOf("Windows") !== -1) {
        var escaped = json.replace(/"/g, '\\"');
        var cmd = 'powershell -Command "Invoke-RestMethod -Uri \'' + url + '\' '
            + '-Method POST -ContentType \'application/json\' '
            + '-Headers @{Authorization=\'' + API_TOKEN + '\'} '
            + '-Body \'' + escaped + '\'"';
        app.system(cmd);
    } else {
        var escaped = json.replace(/'/g, "'\\''");
        var cmd = "curl -s -X POST '" + url + "' "
            + "-H 'Authorization: " + API_TOKEN + "' "
            + "-H 'Content-Type: application/json' "
            + "-d '" + escaped + "'";
        app.system(cmd);
    }
}

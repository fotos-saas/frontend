/**
 * config.jsx — Kozos beallitasok ExtendScript-hez
 *
 * Font, meret, szin konfiguracio a text layer-ekhez.
 * Minden action script #include-olja ezt.
 */

var CONFIG = {
  // Szoveg layer alapertelmezes
  FONT_NAME: "ArialMT",
  FONT_SIZE: 25,           // pontmeret (pt)
  TEXT_COLOR: { r: 0, g: 0, b: 0 },

  // JSON temp fajl — ha nincs explicit megadva, az args-bol jon
  // (Ez placeholder, az action script allitja be a tényleges útvonalat)
  DATA_FILE_PATH: null
};

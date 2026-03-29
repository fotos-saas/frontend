/**
 * Script escape segédfüggvények — AppleScript és JSX (ExtendScript) kontextushoz
 */

/** AppleScript string escape — megakadályozza az injection-t */
export function appleScriptEscape(str: string): string {
  return str
    .replace(/\0/g, '')     // null byte eltávolítás
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/** JSX (ExtendScript) string escape — külön kontextus az AppleScript-től */
export function jsxStringEscape(str: string): string {
  return str
    .replace(/\0/g, '')     // null byte eltávolítás
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

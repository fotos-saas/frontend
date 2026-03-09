/**
 * Verzio informacio interface
 * A version.json strukturaja, amit a build script general.
 */
export interface VersionInfo {
  hash: string;
  timestamp: string;
  buildTime: number;
  branch: string;
}

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import log from 'electron-log/main';

/** Python script base path (extraResources or dev) */
export function getScriptsPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'scripts', 'portrait', 'python')
    : path.join(__dirname, '..', '..', 'scripts', 'portrait', 'python');
}

/** Venv python binary path (platform-aware) */
export function getPythonPath(): string {
  const scriptsPath = getScriptsPath();
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(scriptsPath, '.venv', 'Scripts', 'python.exe')
    : path.join(scriptsPath, '.venv', 'bin', 'python3');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  // Fallback: system python3
  log.warn('Portrait venv python nem talalhato, system python3 hasznalata');
  return 'python3';
}

/** Ensure venv exists, create if missing. Returns true if ready. */
export function ensureVenv(): boolean {
  const scriptsPath = getScriptsPath();
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(scriptsPath, '.venv', 'Scripts', 'python.exe')
    : path.join(scriptsPath, '.venv', 'bin', 'python3');

  // Already exists and works?
  if (fs.existsSync(venvPython)) {
    return true;
  }

  const requirementsPath = path.join(scriptsPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    log.error('Portrait requirements.txt nem talalhato');
    return false;
  }

  log.info('Portrait venv letrehozasa...');
  try {
    // Create venv
    execFileSync('python3', ['-m', 'venv', path.join(scriptsPath, '.venv')], {
      timeout: 60000,
    });

    // Install requirements
    const pipPath = isWin
      ? path.join(scriptsPath, '.venv', 'Scripts', 'pip.exe')
      : path.join(scriptsPath, '.venv', 'bin', 'pip');

    execFileSync(pipPath, ['install', '-r', requirementsPath, '--quiet'], {
      timeout: 300000, // 5 perc (torch + modell letoltes)
    });

    log.info('Portrait venv sikeresen letrehozva');
    return fs.existsSync(venvPython);
  } catch (err: unknown) {
    log.error('Portrait venv letrehozas sikertelen:', (err as Error).message);
    return false;
  }
}

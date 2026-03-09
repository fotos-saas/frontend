#!/usr/bin/env node
/**
 * Version.json generalo script
 *
 * Build idoben fut (prebuild hook). Git hash + timestamp alapjan
 * general version.json-t es build-version.ts-t.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitHash() {
  try {
    return execSync('git rev-parse --short=8 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    if (process.env.GIT_HASH) {
      return process.env.GIT_HASH.substring(0, 8);
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return `${pkg.version}-${Date.now().toString(36)}`;
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return process.env.GIT_BRANCH || 'unknown';
  }
}

const version = {
  hash: getGitHash(),
  timestamp: new Date().toISOString(),
  buildTime: Date.now(),
  branch: getGitBranch(),
};

// 1. version.json generalasa (assets-be)
const jsonPath = path.join(__dirname, '..', 'src', 'assets', 'version.json');
const jsonDir = path.dirname(jsonPath);
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}
fs.writeFileSync(jsonPath, JSON.stringify(version, null, 2), 'utf8');

// 2. build-version.ts generalasa (TypeScript importhoz)
const tsContent = `// AUTO-GENERALT FAJL - NE MODOSITSD KEZZEL!
// Generalva: ${version.timestamp}
export const BUILD_HASH = '${version.hash}';
export const BUILD_TIMESTAMP = '${version.timestamp}';
export const BUILD_TIME = ${version.buildTime};
`;

const tsPath = path.join(__dirname, '..', 'src', 'app', 'core', 'constants', 'build-version.ts');
const tsDir = path.dirname(tsPath);
if (!fs.existsSync(tsDir)) {
  fs.mkdirSync(tsDir, { recursive: true });
}
fs.writeFileSync(tsPath, tsContent, 'utf8');

// eslint-disable-next-line no-console
console.log(`[Version] Generalva: ${version.hash} (${version.timestamp})`);

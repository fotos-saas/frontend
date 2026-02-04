#!/usr/bin/env node
/**
 * Sentry Source Map Upload Script
 *
 * Ez a script feltolti a source map-eket a Sentry-re build utan.
 * Futtatas: node scripts/sentry-sourcemaps.js
 *
 * Kornyezeti valtozok:
 * - SENTRY_AUTH_TOKEN: Sentry auth token (kotelozo)
 * - SENTRY_ORG: Sentry organization slug (kotelozo)
 * - SENTRY_PROJECT: Sentry project slug (kotelozo)
 * - SENTRY_RELEASE: Release verzio (opcionalis, alapertelmezett: package.json version)
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Kornyezeti valtozok ellenorzese
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

if (!SENTRY_AUTH_TOKEN) {
  console.log('[Sentry] SENTRY_AUTH_TOKEN not set, skipping source map upload');
  process.exit(0);
}

if (!SENTRY_ORG || !SENTRY_PROJECT) {
  console.error('[Sentry] SENTRY_ORG and SENTRY_PROJECT must be set');
  process.exit(1);
}

// Release verzio
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const RELEASE = process.env.SENTRY_RELEASE || `photostack@${packageJson.version}`;

// Build konyvtarak
const ANGULAR_DIST = path.join(__dirname, '..', 'dist', 'frontend-tablo', 'browser');
const ELECTRON_DIST = path.join(__dirname, '..', 'electron', 'dist');

// Sentry CLI path
const SENTRY_CLI = path.join(__dirname, '..', 'node_modules', '.bin', 'sentry-cli');

console.log(`[Sentry] Uploading source maps for release: ${RELEASE}`);

try {
  // Release letrehozasa
  console.log('[Sentry] Creating release...');
  execFileSync(
    SENTRY_CLI,
    ['releases', 'new', RELEASE, '--org', SENTRY_ORG, '--project', SENTRY_PROJECT],
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } }
  );

  // Angular source maps feltoltese
  if (fs.existsSync(ANGULAR_DIST)) {
    console.log('[Sentry] Uploading Angular source maps...');
    execFileSync(
      SENTRY_CLI,
      [
        'releases', 'files', RELEASE, 'upload-sourcemaps', ANGULAR_DIST,
        '--url-prefix', '~/',
        '--org', SENTRY_ORG,
        '--project', SENTRY_PROJECT
      ],
      { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } }
    );
  } else {
    console.log('[Sentry] Angular dist folder not found, skipping...');
  }

  // Electron source maps feltoltese
  if (fs.existsSync(ELECTRON_DIST)) {
    console.log('[Sentry] Uploading Electron source maps...');
    execFileSync(
      SENTRY_CLI,
      [
        'releases', 'files', RELEASE, 'upload-sourcemaps', ELECTRON_DIST,
        '--url-prefix', '~/electron/dist/',
        '--org', SENTRY_ORG,
        '--project', SENTRY_PROJECT
      ],
      { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } }
    );
  } else {
    console.log('[Sentry] Electron dist folder not found, skipping...');
  }

  // Release finalize
  console.log('[Sentry] Finalizing release...');
  execFileSync(
    SENTRY_CLI,
    ['releases', 'finalize', RELEASE, '--org', SENTRY_ORG, '--project', SENTRY_PROJECT],
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } }
  );

  console.log('[Sentry] Source maps uploaded successfully!');
} catch (error) {
  console.error('[Sentry] Failed to upload source maps:', error.message);
  process.exit(1);
}

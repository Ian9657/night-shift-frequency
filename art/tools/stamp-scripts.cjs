#!/usr/bin/env node
// Stamps every local script in index.html with one version, `?v=<hash>`, taken from the
// scripts' own contents. GitHub Pages lets a browser keep a file for ten minutes; one
// stamp across all of them means a page never runs a new script beside an old one.
// Run after changing anything under js/ or assets/:
//
//   node art/tools/stamp-scripts.cjs
//
// tests/content.test.cjs fails while a stamp is missing or out of date.
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const PAGE = path.join(ROOT, 'index.html');
const SCRIPT = /<script src="([^"?]+)(?:\?v=[^"]*)?"><\/script>/g;

// The page's local scripts, in order, and the stamp their contents call for.
function expected(html = fs.readFileSync(PAGE, 'utf8')) {
  const files = [...html.matchAll(SCRIPT)].map(m => m[1]);
  const hash = crypto.createHash('sha1');
  for (const file of files) hash.update(file).update(fs.readFileSync(path.join(ROOT, file)));
  return { files, version: hash.digest('hex').slice(0, 10) };
}

function stamp(html) {
  const { version } = expected(html);
  return html.replace(SCRIPT, (_, file) => `<script src="${file}?v=${version}"></script>`);
}

if (require.main === module) {
  const html = fs.readFileSync(PAGE, 'utf8'), next = stamp(html);
  fs.writeFileSync(PAGE, next);
  console.log(next === html ? 'index.html already stamped' : 'stamped index.html ?v=' + expected(next).version);
}

module.exports = { expected, stamp, SCRIPT };

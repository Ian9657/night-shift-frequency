// Runs every check, one after another, and judges each by its exit code (not by what it
// prints). Prints a line per check and, for a failure, the end of its output; exits
// non-zero if any check failed.
//   node tests/run-all.cjs             the verification list
//   node tests/run-all.cjs --pacing    also the optional real-time radio pacing probe
//   node tests/run-all.cjs counter     only the checks whose name contains "counter"
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const CHECKS = ['shift-engine.test', 'content.test', 'art.test', 'counter.test', 'radio.test', 'audio.test', 'browser-flow', 'visual'];
const args = process.argv.slice(2);
const filters = args.filter(a => !a.startsWith('--'));
const list = [...CHECKS, ...(args.includes('--pacing') ? ['radio-pacing'] : [])]
  .filter(name => !filters.length || filters.some(f => name.includes(f)));

let failed = 0;
for (const name of list) {
  const started = Date.now();
  const run = spawnSync(process.execPath, [path.join(__dirname, name + '.cjs')], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
  const output = (run.stdout + run.stderr).trimEnd().split('\n');
  const seconds = ((Date.now() - started) / 1000).toFixed(0).padStart(4);
  const ok = run.status === 0;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(18)} ${seconds}s  ${output.filter(l => l.trim()).at(-1) || ''}`.slice(0, 140));
  if (!ok) {
    failed++;
    console.log(output.slice(-25).map(l => '     | ' + l).join('\n'));
  }
}
console.log(failed ? `${failed} of ${list.length} checks failed` : `all ${list.length} checks passed`);
process.exitCode = failed ? 1 : 0;

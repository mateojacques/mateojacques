import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, assignDefaults, distinctRandom } from '../lib/characters.js';

const charDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'characters');
const slugsOf = (n) => Array.from({ length: n }, (_, i) => `post-${i}`);

// Small seeded PRNG so random tests are reproducible.
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

test('CHARACTERS lists 15 files that exist in static/characters', () => {
  assert.equal(CHARACTERS.length, 15);
  assert.deepEqual(CHARACTERS, Array.from({ length: 15 }, (_, i) => `c${i + 1}.png`));
  for (const name of CHARACTERS) assert.ok(fs.existsSync(path.join(charDir, name)), name);
});

test('every character image is at most 128px on its long edge and under 60 KB', () => {
  for (const name of CHARACTERS) {
    const bytes = fs.readFileSync(path.join(charDir, name));
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    assert.ok(Math.max(width, height) <= 128, `${name} is ${width}x${height}`);
    assert.equal(Math.max(width, height), 128, `${name} should be shrunk to exactly 128px`);
    assert.ok(bytes.length < 60 * 1024, `${name} is ${bytes.length} bytes`);
  }
});

test('assignDefaults is deterministic', () => {
  const slugs = ['welcome-to-go10', 'rigging-notes', 'usd-basics'];
  assert.deepEqual(assignDefaults(slugs), assignDefaults(slugs));
});

test('assignDefaults gives distinct characters for up to 15 slugs', () => {
  for (const n of [1, 2, 7, 15]) {
    const values = Object.values(assignDefaults(slugsOf(n)));
    assert.equal(values.length, n);
    assert.equal(new Set(values).size, n);
    for (const v of values) assert.ok(CHARACTERS.includes(v));
  }
});

test('assignDefaults still returns a character for 20 slugs', () => {
  const result = assignDefaults(slugsOf(20));
  assert.equal(Object.keys(result).length, 20);
  for (const v of Object.values(result)) assert.ok(CHARACTERS.includes(v));
});

test('distinctRandom has no repeats when count <= pool size', () => {
  const rng = seeded(42);
  for (let count = 1; count <= CHARACTERS.length; count++) {
    const picks = distinctRandom(count, CHARACTERS, rng);
    assert.equal(picks.length, count);
    assert.equal(new Set(picks).size, count);
  }
});

test('distinctRandom returns count items when count exceeds the pool', () => {
  const picks = distinctRandom(40, CHARACTERS, seeded(7));
  assert.equal(picks.length, 40);
  // Each full pass through the pool has no repeats.
  assert.equal(new Set(picks.slice(0, 15)).size, 15);
  assert.equal(new Set(picks.slice(15, 30)).size, 15);
});

test('distinctRandom only returns pool members', () => {
  const pool = ['a.png', 'b.png', 'c.png'];
  for (const pick of distinctRandom(10, pool, Math.random)) assert.ok(pool.includes(pick));
});

test('distinctRandom(0, ...) returns []', () => {
  assert.deepEqual(distinctRandom(0, CHARACTERS, Math.random), []);
});

test('distinctRandom works when inlined from its source text', () => {
  const inlined = new Function(`return (${distinctRandom.toString()})`)();
  assert.equal(new Set(inlined(15, CHARACTERS, seeded(3))).size, 15);
});

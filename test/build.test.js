import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

// A fresh copy of the fixture site in a temp dir, so tests can modify it.
function tempSite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'go10-'));
  const root = path.join(dir, 'site');
  fs.cpSync(fixtures, root, { recursive: true, filter: (src) => !src.startsWith(path.join(fixtures, 'invalid')) });
  return { root, outDir: path.join(dir, 'dist') };
}

async function builtSite() {
  const site = tempSite();
  await build(site);
  return site;
}

// Every file under dir, as forward-slash relative paths, sorted.
function listFiles(dir) {
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
}

const read = (outDir, rel) => fs.readFileSync(path.join(outDir, rel), 'utf8');

test('writes index, post, about, 404 and feed files', async () => {
  const { outDir } = await builtSite();
  const files = listFiles(outDir);
  for (const expected of ['index.html', 'hello-world/index.html', 'folder-post/index.html', 'cafe-and-co/index.html', 'tie-a/index.html', 'tie-b/index.html', 'about/index.html', '404.html', 'feed.xml']) {
    assert.ok(files.includes(expected), `missing ${expected}`);
  }
  assert.match(read(outDir, 'index.html'), /<a href="\/hello-world\/">Hello World<\/a>/);
  assert.match(read(outDir, 'hello-world/index.html'), /<strong>world<\/strong>/);
  const about = read(outDir, 'about/index.html');
  assert.match(about, /I am a <strong>fixture<\/strong> author/);
  assert.doesNotMatch(about, /Ignored/);
  assert.equal((read(outDir, 'feed.xml').match(/<item>/g) ?? []).length, 5);
});

test('copies static assets to the output root', async () => {
  const { root, outDir } = await builtSite();
  // Compare with the source rather than a literal: git may check it out with CRLF.
  assert.equal(read(outDir, 'styles.css'), fs.readFileSync(path.join(root, 'static', 'styles.css'), 'utf8'));
  assert.match(read(outDir, 'styles.css'), /body \{ color: #111; \}/);
  assert.ok(fs.existsSync(path.join(outDir, 'characters', 'README.txt')));
});

test("copies a folder post's images next to its page", async () => {
  const { root, outDir } = await builtSite();
  const copied = path.join(outDir, 'folder-post', 'diagram.png');
  assert.deepEqual(fs.readFileSync(copied), fs.readFileSync(path.join(root, 'content', 'posts', 'folder-post', 'diagram.png')));
  assert.ok(!fs.existsSync(path.join(outDir, 'folder-post', 'index.md')), 'source markdown is not published');
  assert.match(read(outDir, 'folder-post/index.html'), /<img src="diagram.png" alt="A tiny diagram">/);
  assert.match(read(outDir, 'feed.xml'), /src="https:\/\/go10.dev\/folder-post\/diagram.png"/);
});

test('uses forward slashes in every generated url', async () => {
  const { outDir } = await builtSite();
  for (const file of listFiles(outDir).filter((f) => /\.(html|xml)$/.test(f))) {
    const text = read(outDir, file);
    for (const [, value] of text.matchAll(/\b(?:src|href)="([^"]*)"/g)) assert.ok(!value.includes('\\'), `${file}: ${value}`);
    for (const [, value] of text.matchAll(/<(?:link|guid)[^>]*>([^<]*)</g)) assert.ok(!value.includes('\\'), `${file}: ${value}`);
  }
});

test('does not publish drafts', async () => {
  const { outDir } = await builtSite();
  assert.ok(!fs.existsSync(path.join(outDir, 'unfinished')));
  for (const file of listFiles(outDir).filter((f) => /\.(html|xml)$/.test(f))) {
    assert.doesNotMatch(read(outDir, file), /Unfinished Thoughts|unfinished/, file);
  }
});

test('build fails with a message naming the bad file', async () => {
  const site = tempSite();
  fs.copyFileSync(path.join(fixtures, 'invalid', 'missing-summary', 'no-summary.md'), path.join(site.root, 'content', 'posts', 'no-summary.md'));
  await assert.rejects(build(site), /no-summary\.md/);
});

test('fails when a post slug collides with a generated or static path', async () => {
  for (const slug of ['about', 'characters']) {
    const site = tempSite();
    fs.writeFileSync(path.join(site.root, 'content', 'posts', `${slug}.md`), '---\ntitle: T\ndate: 2026-01-01\nsummary: S\n---\nx\n');
    await assert.rejects(build(site), new RegExp(`${slug}\\.md`));
  }
});

test('empties outDir before building', async () => {
  const site = tempSite();
  fs.mkdirSync(site.outDir, { recursive: true });
  fs.writeFileSync(path.join(site.outDir, 'stale.html'), 'old');
  await build(site);
  assert.ok(!fs.existsSync(path.join(site.outDir, 'stale.html')));
});

test('refuses to use the site root as outDir', async () => {
  const site = tempSite();
  await assert.rejects(build({ root: site.root, outDir: site.root }), /outDir/);
  assert.ok(fs.existsSync(path.join(site.root, 'content', 'about.md')));
});

test('running twice produces identical output', async () => {
  const site = tempSite();
  await build(site);
  const first = new Map(listFiles(site.outDir).map((f) => [f, fs.readFileSync(path.join(site.outDir, f))]));
  await build(site);
  const second = listFiles(site.outDir);
  assert.deepEqual(second, [...first.keys()]);
  for (const f of second) assert.ok(first.get(f).equals(fs.readFileSync(path.join(site.outDir, f))), f);
});

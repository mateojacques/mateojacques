import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addImage, sniffExtension, MAX_BYTES } from '../lib/image.js';
import { loadPosts } from '../lib/posts.js';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-'));
  fs.writeFileSync(path.join(dir, 'flat.md'), '---\r\ntitle: T\r\ndate: 2026-01-01\r\nsummary: S\r\n---\r\nBody\r\n');
  const src = path.join(dir, 'upload.png');
  fs.writeFileSync(src, PNG);
  return { dir, src };
}
const fakeFetch = (bytes, status = 200) => async () => ({ ok: status === 200, status, arrayBuffer: async () => bytes });

test('sniffExtension recognises image types by their bytes and refuses SVG', () => {
  assert.equal(sniffExtension(PNG), '.png');
  assert.equal(sniffExtension(JPG), '.jpg');
  assert.equal(sniffExtension(Buffer.from('GIF89a......')), '.gif');
  assert.equal(sniffExtension(Buffer.from('RIFF....WEBPVP8 ')), '.webp');
  assert.equal(sniffExtension(Buffer.from('....ftypavif')), '.avif');
  assert.equal(sniffExtension(SVG), null);
});

test('uploading a file turns a flat post into a folder post with front matter', async () => {
  const { dir, src } = setup();
  const { image } = await addImage({ postsDir: dir, slug: 'flat', source: src, alt: 'A rig' });
  assert.equal(image, 'cover.png');
  assert.ok(!fs.existsSync(path.join(dir, 'flat.md')));
  assert.ok(fs.existsSync(path.join(dir, 'flat', 'cover.png')));
  const md = fs.readFileSync(path.join(dir, 'flat', 'index.md'), 'utf8');
  assert.match(md, /\r\nimage: cover.png\r\nimageAlt: A rig\r\n---\r\nBody/);
  const [loaded] = loadPosts(dir);
  assert.equal(loaded.image, 'cover.png');
  assert.equal(loaded.imageAlt, 'A rig');
});

test('a link is downloaded into the post, and replacing it leaves one cover', async () => {
  const { dir, src } = setup();
  await addImage({ postsDir: dir, slug: 'flat', source: src, alt: 'First' });
  await addImage({ postsDir: dir, slug: 'flat', source: 'https://example.com/x', alt: 'Second', fetchImpl: fakeFetch(JPG) });
  assert.deepEqual(fs.readdirSync(path.join(dir, 'flat')).sort(), ['cover.jpg', 'index.md']);
  const md = fs.readFileSync(path.join(dir, 'flat', 'index.md'), 'utf8');
  assert.equal(md.match(/^image:/gm).length, 1);
  assert.match(md, /imageAlt: Second/);
});

test('bad input is rejected before anything changes', async () => {
  const { dir, src } = setup();
  const attempt = (over) => addImage({ postsDir: dir, slug: 'flat', source: src, alt: 'ok', ...over });
  await assert.rejects(attempt({ alt: '' }), /alt text/);
  await assert.rejects(attempt({ slug: 'missing' }), /No post with the slug/);
  await assert.rejects(attempt({ source: 'https://e.com/a', fetchImpl: fakeFetch(SVG) }), /Unsupported image/);
  await assert.rejects(attempt({ source: 'https://e.com/a', fetchImpl: fakeFetch(PNG, 404) }), /HTTP 404/);
  await assert.rejects(attempt({ source: 'https://e.com/a', fetchImpl: fakeFetch(Buffer.alloc(MAX_BYTES + 1)) }), /limit/);
  await assert.rejects(attempt({ source: path.join(dir, 'nope.png') }), /No such file/);
  assert.ok(fs.existsSync(path.join(dir, 'flat.md')), 'post untouched');
});

test('loading rejects links, missing files, escapes and a missing imageAlt', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-'));
  const make = (name, fm, withFile = true) => {
    fs.mkdirSync(path.join(dir, name));
    fs.writeFileSync(path.join(dir, name, 'index.md'), `---\ntitle: T\ndate: 2026-01-01\nsummary: S\n${fm}---\nB\n`);
    if (withFile) fs.writeFileSync(path.join(dir, name, 'cover.png'), PNG);
  };
  const fails = (name, fm, pattern, withFile) => {
    make(name, fm, withFile);
    assert.throws(() => loadPosts(dir), pattern);
    fs.rmSync(path.join(dir, name), { recursive: true });
  };
  fails('a', 'image: https://example.com/x.png\nimageAlt: x\n', /is a link; run: node scripts\/add-image.js/);
  fails('b', 'image: cover.png\n', /needs an "imageAlt"/);
  fails('c', 'image: gone.png\nimageAlt: x\n', /does not exist/);
  fails('d', 'image: ../x.png\nimageAlt: x\n', /inside the post's folder/);
  fails('e', 'image: cover.svg\nimageAlt: x\n', /must be one of/);
  fs.writeFileSync(path.join(dir, 'flat.md'), '---\ntitle: T\ndate: 2026-01-01\nsummary: S\nimage: cover.png\nimageAlt: x\n---\nB\n');
  assert.throws(() => loadPosts(dir), /needs a post folder/);
});
